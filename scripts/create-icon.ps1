Add-Type -AssemblyName System.Drawing
$assetDirectory = Join-Path $PSScriptRoot '..\assets'
New-Item -ItemType Directory -Path $assetDirectory -Force | Out-Null
$bitmap = New-Object System.Drawing.Bitmap(256,256)
$graphics = [System.Drawing.Graphics]::FromImage($bitmap)
$graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$graphics.Clear([System.Drawing.ColorTranslator]::FromHtml('#153c35'))
$pen = New-Object System.Drawing.Pen([System.Drawing.ColorTranslator]::FromHtml('#bad8a8'),24)
$pen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
$pen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
$graphics.TranslateTransform(128,128)
$graphics.RotateTransform(18)
$graphics.DrawLine($pen,-49,-43,-49,37)
$graphics.DrawLine($pen,0,-67,0,66)
$graphics.DrawLine($pen,49,-18,49,35)
$bitmap.Save((Join-Path $assetDirectory 'icon.png'),[System.Drawing.Imaging.ImageFormat]::Png)
$icon = [System.Drawing.Icon]::FromHandle($bitmap.GetHicon())
$stream = [IO.File]::Create((Join-Path $assetDirectory 'icon.ico'))
$icon.Save($stream)
$stream.Dispose()
$pen.Dispose()
$graphics.Dispose()
$bitmap.Dispose()
