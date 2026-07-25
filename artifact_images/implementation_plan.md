# Excel AI Automation Feature

This implementation plan details the addition of a premium visual Excel AI Automation tool. It allows users to manage grid-based sheets, add rows manually, generate custom rows dynamically using either a local smart Mock AI Engine or real LLM APIs (OpenAI/Gemini), arrange columns/rows, and export the final sheet directly as a `.xlsx` Excel file.

## User Review Required

> [!IMPORTANT]
> The solution is implemented on a new Next.js page `/excel` in the root dashboard project. To support generating true Excel files client-side, we will install the standard `xlsx` (SheetJS) package.

> [!TIP]
> To ensure the tool works seamlessly out-of-the-box without requiring API keys, we will implement a highly intelligent local Mock AI Engine that parses user columns/headers and custom prompts to generate highly realistic, contextual data. We will also provide fields for users to supply their own OpenAI or Gemini API keys for actual AI-driven generation.

## Open Questions

* No open questions. The planned UI fits directly into the existing design framework of `NEURON_FLOW`.

---

## Proposed Changes

### Dependencies

#### [MODIFY] [package.json](file:///d:/.vscode/workspace/package.json)
* Install `xlsx` package in the root workspace to enable Excel workbook generation.

### Pages

#### [NEW] [excel.js](file:///d:/.vscode/workspace/pages/excel.js)
* Create a premium dark-themed interactive spreadsheet dashboard.
* **UI Structure**:
  * **Header**: Navigation with a back button to the main dashboard.
  * **Left Sidebar**: AI Generator Panel
    * Selection of data generation presets (Sales Leads, Product Inventory, Task Tracker, Customer Feedback).
    * Custom text area for AI prompts.
    * Slider to select row counts (5 to 50).
    * API selector (Mock AI Engine, OpenAI GPT-4o, Gemini 1.5 Pro) with an optional API key input field.
    * Glowing "Generate with AI" button with animation states.
  * **Main Grid Area**:
    * Spreadsheet toolbar: Add Row, Add Column, Clear, Export to Excel.
    * Interactive Data Grid Table:
      * Click to edit cells.
      * Header editor: Rename columns and delete columns.
      * Row action: Delete specific rows.
      * Auto-fill AI integration.
* **AI Logic**:
  * Local Mock AI: Evaluates current columns and prompt requirements to generate high-fidelity mock data (e.g. realistic names, emails, dates, product categories, prices, statuses).
  * Remote LLM Integration: Directly calls OpenAI or Gemini APIs using user-supplied keys to fetch structured JSON data matching the current headers.
* **Excel Export**:
  * Converts the React grid state to an Excel worksheet using the `xlsx` library and triggers a client-side download.

#### [MODIFY] [index.js](file:///d:/.vscode/workspace/pages/index.js)
* Add a third launcher card for the **Excel AI Automator** page to make it easily accessible from the landing page.
* Fix the `.material-symbols-outlined` style rule from hiding standard icons if we decide to use them on the excel page.

---

## Verification Plan

### Manual Verification
1. Boot the application stack (`npm run dev:all`).
2. Navigate to the landing page at `http://localhost:3000`.
3. Verify the new launcher card "Excel AI Automation" is visible and clickable.
4. Click on it to open `http://localhost:3000/excel`.
5. Test adding a row and editing columns manually.
6. Enter an AI prompt (e.g., "Generate 10 real estate leads with Name, Address, Price, Agent Name") and click "Generate".
7. Verify that data is correctly inserted and matches the columns.
8. Click "Download Excel File" and open the downloaded `.xlsx` file to confirm formatting and data integrity.
