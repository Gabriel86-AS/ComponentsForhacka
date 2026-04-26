import { Upload } from "lucide-react";
import { useEffect, useRef } from "react";
import * as XLSX from "xlsx";
import { useExcelStore } from "@/store/excel.store";

export const InputExcel = () => {
  const fileName = useExcelStore((state) => state.fileName);
  const clearExcelData = useExcelStore((state) => state.clearExcelData);
  const setExcelData = useExcelStore((state) => state.setExcelData);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!fileName && inputRef.current) {
      inputRef.current.value = "";
    }
  }, [fileName]);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      clearExcelData();
      return;
    }

    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data, { type: "array" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(sheet, {
      raw: false,
    });

    setExcelData(file.name, jsonData as Record<string, unknown>[]);
  };

  return (
    <label
      htmlFor="excel-upload-input"
      className={`flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg border transition-colors ${
        fileName
          ? "border-red-500/40 bg-red-500/10 text-red-600 hover:bg-red-500/15"
          : "border-input bg-background text-muted-foreground hover:bg-accent hover:text-foreground"
      }`}
      title={fileName ? `Archivo seleccionado: ${fileName}` : "Subir Excel"}
    >
      <Upload className="h-4 w-4" />
      <input
        ref={inputRef}
        id="excel-upload-input"
        type="file"
        accept=".xlsx,.xls"
        onChange={handleFile}
        className="hidden"
      />
    </label>
  );
};
