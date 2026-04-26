import { create, type StateCreator } from "zustand";
import { devtools, persist } from "zustand/middleware";

export type ExcelRow = Record<string, unknown>;

interface ExcelState {
    fileName: string | null;
    data: ExcelRow[];
    hasFile: boolean;
    setExcelData: (fileName: string, data: ExcelRow[]) => void;
    clearExcelData: () => void;
}

const storeApi: StateCreator<ExcelState> = (set) => ({
    fileName: null,
    data: [],
    hasFile: false,
    setExcelData: (fileName, data) =>
        set({ fileName, data, hasFile: true }),
    clearExcelData: () => set({ fileName: null, data: [], hasFile: false }),
});

export const useExcelStore = create<ExcelState>()(
    devtools(
        persist(storeApi, {
            name: "excel-store",
        })
    )
);