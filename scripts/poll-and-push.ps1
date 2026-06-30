$deviceCode = '4849fe941451734fda925fef4c7d0d14c847135f'
$clientId = '178c6fc778ccc68e1d6a'
$maxAttempts = 120

for ($i = 0; $i -lt $maxAttempts; $i++) {
  Start-Sleep -Seconds 5
  try {
    $body = @{
      client_id = $clientId
      device_code = $deviceCode
      grant_type = 'urn:ietf:params:oauth:grant-type:device_code'
    }
    $headers = @{ Accept = 'application/json' }
    $r = Invoke-RestMethod -Uri 'https://github.com/login/oauth/access_token' -Method Post -Body $body -Headers $headers
    if ($r.access_token) {
      $token = $r.access_token
      Set-Location 'd:\Candidate test'
      git push "https://x-access-token:${token}@github.com/JamilPr1/AI-Test-Online.git" main 2>&1 | Out-File 'd:\Candidate test\.push-result.txt'
      'PUSH_DONE' | Out-File 'd:\Candidate test\.push-result.txt' -Append
      exit 0
    }
  } catch {
    $err = $_.ErrorDetails.Message | ConvertFrom-Json -ErrorAction SilentlyContinue
    if ($err.error -ne 'authorization_pending') {
      "ERROR: $($err.error)" | Out-File 'd:\Candidate test\.push-result.txt'
      exit 1
    }
  }
}
'TIMEOUT' | Out-File 'd:\Candidate test\.push-result.txt'
exit 1
