# 第三方资源

- Electron 40.10.6：MIT；运行时自带 LICENSE 与 LICENSES.chromium.html，分发时必须保留。https://github.com/electron/electron
- Noto Sans SC：fonts/NotoSansSC.ttf；SIL OFL 1.1；许可证 fonts/NotoSansSC-LICENSE.txt。对应上游 https://github.com/google/fonts/tree/main/ofl/notosanssc
- Roboto Italic：fonts/Roboto-Italic.ttf；SIL OFL 1.1；许可证 fonts/Roboto-LICENSE.txt。对应上游 https://github.com/google/fonts/tree/main/ofl/roboto

公开前核对时，仓库中的两个字体文件均与上述 Google Fonts 上游文件的 SHA-256 一致。分发时保留字体的版权声明和 SIL OFL 1.1 许可文件。

浮窗图钉和按钮使用文本字符与 CSS，托盘图标由项目代码绘制。字符的具体字形由字体/系统回退字体决定；系统字体不随包额外分发。

源码采用 MIT；Electron 与字体许可不因此改变。
