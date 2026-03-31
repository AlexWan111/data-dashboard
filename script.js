let currentData = null;

// Initialize event listeners on page load
document.addEventListener("DOMContentLoaded", () => {
  const uploadArea = document.getElementById("uploadArea");
  const fileInput = document.getElementById("fileInput");

  // Drag-and-drop support
  uploadArea.addEventListener("dragover", (e) => {
    e.preventDefault();
    uploadArea.classList.add("dragover");
  });

  uploadArea.addEventListener("dragleave", () => {
    uploadArea.classList.remove("dragover");
  });

  uploadArea.addEventListener("drop", (e) => {
    e.preventDefault();
    uploadArea.classList.remove("dragover");
    if (e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  });

  // Click-to-upload support
  uploadArea.addEventListener("click", () => {
    fileInput.click();
  });

  fileInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    processFile(file);
  });
});

// Process file (supports CSV and Excel files)
function processFile(file) {
  if (!file) {
    alert("请选择一个文件！");
    return;
  }

  const fileName = file.name.toLowerCase();

  const reader = new FileReader();

  if (fileName.endsWith('.csv')) {
    reader.onload = (e) => {
      parseCSV(e.target.result);
    };
    reader.readAsText(file);
  } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
    reader.onload = (e) => {
      parseExcel(new Uint8Array(e.target.result));
    };
    reader.readAsArrayBuffer(file);
  } else {
    alert("文件类型不支持，请上传 CSV 或 Excel 文件！");
  }
}

// CSV parsing
function parseCSV(data) {
  Papa.parse(data, {
    header: true,
    skipEmptyLines: true,
    complete: (results) => {
      currentData = results.data;
      if (currentData.length > 0) {
        renderData();
      } else {
        alert("CSV 文件为空！");
      }
    },
  });
}

// Excel parsing
function parseExcel(data) {
  const workbook = XLSX.read(data, { type: "array" });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];

  currentData = XLSX.utils.sheet_to_json(worksheet);

  if (currentData.length > 0) {
    renderData();
  } else {
    alert("Excel 文件为空或数据无效！");
  }
}

// Render Data Preview
function renderData() {
  const dataPreview = document.getElementById("dataPreview");
  const headers = Object.keys(currentData[0]);
  const previewHTML = `
    <table border="1">
      <tr>${headers.map((header) => `<th>${header}</th>`).join("")}</tr>
      ${currentData
        .slice(0, 10)
        .map(
          (row) =>
            `<tr>${headers
              .map((header) => `<td>${row[header] || ""}</td>`)
              .join("")}</tr>`
        )
        .join("")}
    </table>`;

  dataPreview.innerHTML = previewHTML;
}
