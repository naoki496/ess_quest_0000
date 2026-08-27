# v31 internal improvements

- 戦闘キャラクター画像を actor 枠内に絶対配置し、PC/タブレット/スマホで下端が見切れないよう共通化。
- 横画面の接地位置に安全余白を追加。表主人公の既存縮小意図を正しい direct-child selector へ修正。
- bossHpHud / bossHpFill が HTML に無い旧 index.html でも JS 側で自動生成するフォールバックを追加。現 index.html にも HP HUD を保持。
- 上部進行表示を全75問ではなく各ステージ 0/15〜15/15 に変更。内部 totalProgress 75問管理は保持。
- デバッグ全解放に各ステージ「最初」「ボス5問目」の2系統を追加（表裏計20ボタン）。
- ボス5問目直接ジャンプは bossQuestion=4 / stage progress=14/15 / HP=20% から開始し、通常の WARNING→ボス登場→カットイン→固有技の流れを通る。
