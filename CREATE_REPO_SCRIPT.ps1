# Alternative: Create GitHub Repository via GitHub CLI (if available)
# or provide commands for manual setup

Write-Host "🚀 SentinelX GitHub Repository Setup" -ForegroundColor Green
Write-Host "===============================================" -ForegroundColor Cyan

# Check if GitHub CLI is available
$ghInstalled = Get-Command gh -ErrorAction SilentlyContinue

if ($ghInstalled) {
    Write-Host "✅ GitHub CLI detected - attempting automatic repository creation..." -ForegroundColor Green
    
    # Try to create repository via GitHub CLI
    gh repo create SentinelX-Trust-Operating-System --public --description "Complete 10-layer Trust Operating System with real-time security scoring, ML behavioral analysis, approval workflows, and attack simulation"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Repository created successfully!" -ForegroundColor Green
        
        # Add remote and push
        git remote add origin https://github.com/$(gh api user --jq .login)/SentinelX-Trust-Operating-System.git
        git branch -M main
        git push -u origin main
        
        if ($LASTEXITCODE -eq 0) {
            $username = gh api user --jq .login
            Write-Host "🎉 SUCCESS! SentinelX pushed to GitHub!" -ForegroundColor Green
            Write-Host "Repository URL: https://github.com/$username/SentinelX-Trust-Operating-System" -ForegroundColor Cyan
        }
    }
} else {
    Write-Host "❌ GitHub CLI not found. Manual setup required." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "📋 Manual Instructions:" -ForegroundColor White
    Write-Host "1. Go to: https://github.com/new" -ForegroundColor Gray
    Write-Host "2. Repository name: SentinelX-Trust-Operating-System" -ForegroundColor Gray
    Write-Host "3. Make it Public, don't initialize" -ForegroundColor Gray
    Write-Host "4. After creation, run:" -ForegroundColor Gray
    Write-Host ""
    Write-Host "git remote add origin https://github.com/YOUR_USERNAME/SentinelX-Trust-Operating-System.git" -ForegroundColor Yellow
    Write-Host "git branch -M main" -ForegroundColor Yellow
    Write-Host "git push -u origin main" -ForegroundColor Yellow
}