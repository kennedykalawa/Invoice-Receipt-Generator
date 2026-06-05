# Invoice & Receipt Generator

A professional, modern web-based generator for invoices and receipts, built with vanilla JavaScript, HTML, and CSS.

## 🚀 Features

- **Dual Mode**: Easily switch between generating Invoices and Receipts.
- **Modern UI**: Clean, responsive design with a live preview.
- **Dark Mode**: Fully supported dark/light theme toggle.
- **Local Persistence**: Automatically saves your form data so you don't lose progress on refresh.
- **Data Portability**: Export your data to JSON and import it later to save time.
- **Print Optimized**:
  - Clean PDF output without browser headers/footers (URL, date, etc.).
  - Professional layout designed for A4/Letter printing.
- **Tracking Support**: Optional integration with Google Sheets via Apps Script for session and document tracking.
- **Customization**:
  - Upload your own business logo.
  - Set custom currency symbols.
  - Add shipping, discounts, and personalized notes.

## 🛠️ One-Time Setup

To enable the tracking feature (optional):
1. Open `app.js`.
2. Find the `SHEET_URL` constant.
3. Replace the placeholder URL with your own Google Apps Script Web App URL.
4. Once configured, the setup banner in the app will automatically disappear.

## 📖 How to Use

1. **Enter Details**: Fill in your business information, client details, and itemize your services.
2. **Preview**: See your document update in real-time on the right-hand side.
3. **Save/Print**: Click "Print / PDF" to save your document. The generator is optimized to remove unnecessary browser information from the printout.
4. **Manage Data**:
   - Use **Reset** to clear the form.
   - Use **Export JSON** to save your current setup for future use.
   - Use **Import JSON** to quickly load a previously saved invoice setup.

## 📄 License

MIT License. Feel free to use and modify for your own needs!
