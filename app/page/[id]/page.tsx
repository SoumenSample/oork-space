"use client";

import { useSearchParams } from "next/navigation";
import Header from "@/components/Header";

export default function Page() {
  const searchParams = useSearchParams();
  const mode = searchParams.get("mode");

  const isEdit = mode === "edit";

  return (
    <div>
      {/* <Header /> */}

      <div className="p-6">
        {isEdit ? (
          <div className="text-green-600 font-bold">
            ✏️ Edit Mode (User can edit)
          </div>
        ) : (
          <div className="text-gray-500 font-bold">
            👁️ View Mode (Read only)
          </div>
        )}
      </div>
    </div>
  );
}