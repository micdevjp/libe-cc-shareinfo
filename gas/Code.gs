/**
 * ClaudeCode活用報告 - GAS JSON API
 * GitHub Pages のフロントエンドから fetch で呼び出される
 *
 * デプロイ手順:
 * 1. https://script.google.com/ で新しいプロジェクトを作成
 * 2. このコードを貼り付け
 * 3. SPREADSHEET_ID を実際のIDに変更
 * 4. デプロイ > 新しいデプロイ > ウェブアプリ
 *    - 実行ユーザー: 自分
 *    - アクセス: 全員
 */

const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID';
const SHEET_NAME = '活用報告';

function doGet() {
  try {
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);
    const values = sheet.getDataRange().getValues();
    const headers = values[0];
    const rows = values.slice(1);

    const range = sheet.getDataRange();
    const richValues = range.getRichTextValues();

    const data = rows.map((row, i) => {
      // リンク列(E列=index4)のRichTextからURLを取得
      const richText = richValues[i + 1][4]; // +1 でヘッダー行をスキップ
      const linkUrl = richText ? (richText.getLinkUrl() || '') : '';

      return {
        id: row[0],
        date: formatDate(row[1]),
        author: row[2],
        category: row[3],
        link: linkUrl,
        summary: row[5],
      };
    });

    const output = JSON.stringify({
      success: true,
      count: data.length,
      data: data,
    });

    return ContentService.createTextOutput(output)
      .setMimeType(ContentService.MimeType.JSON);
  } catch (e) {
    const error = JSON.stringify({
      success: false,
      error: e.message,
    });
    return ContentService.createTextOutput(error)
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function formatDate(value) {
  if (value instanceof Date) {
    const y = value.getFullYear();
    const m = String(value.getMonth() + 1).padStart(2, '0');
    const d = String(value.getDate()).padStart(2, '0');
    return `${y}/${m}/${d}`;
  }
  return String(value);
}
