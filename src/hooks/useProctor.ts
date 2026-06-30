'use client';

import { useCallback, useEffect, useRef } from 'react';

export interface BehaviorEvent {
  type: string;
  timestamp: string;
  detail?: string;
  url?: string;
}

export interface LinkOpened {
  url: string;
  timestamp: string;
  context: string;
}

export interface ProctorState {
  tabSwitches: number;
  focusLosses: number;
  copyEvents: number;
  pasteEvents: number;
  rightClicks: number;
  fullscreenExits: number;
  behaviorLog: BehaviorEvent[];
  linksOpened: LinkOpened[];
}

const initialState: ProctorState = {
  tabSwitches: 0,
  focusLosses: 0,
  copyEvents: 0,
  pasteEvents: 0,
  rightClicks: 0,
  fullscreenExits: 0,
  behaviorLog: [],
  linksOpened: [],
};

export function useProctor(sessionId: string | null, enabled: boolean) {
  const stateRef = useRef<ProctorState>({ ...initialState });
  const wasHiddenRef = useRef(false);

  const logEvent = useCallback((type: string, detail?: string, url?: string) => {
    stateRef.current.behaviorLog.push({
      type,
      timestamp: new Date().toISOString(),
      detail,
      url,
    });
  }, []);

  const syncToServer = useCallback(async () => {
    if (!sessionId || !enabled) return;
    const s = stateRef.current;
    try {
      await fetch('/api/behavior', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          tabSwitches: s.tabSwitches,
          focusLosses: s.focusLosses,
          copyEvents: s.copyEvents,
          pasteEvents: s.pasteEvents,
          rightClicks: s.rightClicks,
          fullscreenExits: s.fullscreenExits,
          behaviorLog: s.behaviorLog.splice(0),
          linksOpened: s.linksOpened.splice(0),
        }),
      });
    } catch {
      // Re-queue on failure
    }
  }, [sessionId, enabled]);

  useEffect(() => {
    if (!enabled) return;

    const onVisibility = () => {
      if (document.hidden) {
        wasHiddenRef.current = true;
        stateRef.current.tabSwitches += 1;
        logEvent('tab_hidden', 'Candidate switched away from test tab');
      } else if (wasHiddenRef.current) {
        wasHiddenRef.current = false;
        logEvent('tab_visible', 'Candidate returned to test tab');
      }
    };

    const onBlur = () => {
      stateRef.current.focusLosses += 1;
      logEvent('window_blur', 'Window lost focus');
    };

    const onCopy = (e: ClipboardEvent) => {
      stateRef.current.copyEvents += 1;
      const selection = window.getSelection()?.toString().slice(0, 80);
      logEvent('copy', selection ? `Copied: "${selection}..."` : 'Copy attempted');
      e.preventDefault();
    };

    const onPaste = (e: ClipboardEvent) => {
      stateRef.current.pasteEvents += 1;
      logEvent('paste', 'Paste attempted');
      e.preventDefault();
    };

    const onContextMenu = (e: MouseEvent) => {
      stateRef.current.rightClicks += 1;
      logEvent('right_click', 'Right-click blocked');
      e.preventDefault();
    };

    const onClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest('a');
      if (anchor && anchor.href) {
        const url = anchor.href;
        if (!url.startsWith(window.location.origin) && !url.startsWith('#')) {
          e.preventDefault();
          stateRef.current.linksOpened.push({
            url,
            timestamp: new Date().toISOString(),
            context: anchor.textContent?.slice(0, 50) || 'link click',
          });
          logEvent('external_link_blocked', anchor.textContent || 'link', url);
        }
      }
    };

    const onFullscreenChange = () => {
      if (!document.fullscreenElement) {
        stateRef.current.fullscreenExits += 1;
        logEvent('fullscreen_exit', 'Exited fullscreen mode');
      }
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (
        (e.ctrlKey || e.metaKey) &&
        ['c', 'v', 'a', 'p', 'u', 's'].includes(e.key.toLowerCase())
      ) {
        e.preventDefault();
        logEvent('shortcut_blocked', `${e.ctrlKey ? 'Ctrl' : 'Cmd'}+${e.key}`);
      }
      if (e.key === 'F12' || (e.ctrlKey && e.shiftKey && e.key === 'I')) {
        e.preventDefault();
        logEvent('devtools_attempt', 'Developer tools shortcut blocked');
      }
    };

    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('blur', onBlur);
    document.addEventListener('copy', onCopy);
    document.addEventListener('paste', onPaste);
    document.addEventListener('contextmenu', onContextMenu);
    document.addEventListener('click', onClick, true);
    document.addEventListener('fullscreenchange', onFullscreenChange);
    document.addEventListener('keydown', onKeyDown);

    const interval = setInterval(syncToServer, 15000);

    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('blur', onBlur);
      document.removeEventListener('copy', onCopy);
      document.removeEventListener('paste', onPaste);
      document.removeEventListener('contextmenu', onContextMenu);
      document.removeEventListener('click', onClick, true);
      document.removeEventListener('fullscreenchange', onFullscreenChange);
      document.removeEventListener('keydown', onKeyDown);
      clearInterval(interval);
    };
  }, [enabled, logEvent, syncToServer]);

  const getState = useCallback(() => ({ ...stateRef.current }), []);

  const flush = useCallback(async () => {
    await syncToServer();
    return getState();
  }, [syncToServer, getState]);

  const requestFullscreen = useCallback(async () => {
    try {
      await document.documentElement.requestFullscreen();
      logEvent('fullscreen_enter', 'Entered fullscreen');
    } catch {
      logEvent('fullscreen_denied', 'Fullscreen request denied');
    }
  }, [logEvent]);

  return { getState, flush, requestFullscreen };
}
