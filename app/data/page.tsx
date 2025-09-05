// "use client";
// import React, { useState } from "react";
// import Papa from "papaparse";
// import { Card, CardContent } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Progress } from "@/components/ui/progress";
// import { Toggle } from "@/components/ui/toggle";
// import {
//   Table,
//   TableBody,
//   TableCell,
//   TableHead,
//   TableHeader,
//   TableRow,
// } from "@/components/ui/table";

// export default function DataPage() {
//   const [jsonData, setJsonData] = useState([]);
//   const [fileName, setFileName] = useState("");
//   const [loading, setLoading] = useState(false);
//   const [progress, setProgress] = useState(0);
//   const [metadata, setMetadata] = useState(null);
//   const [viewMode, setViewMode] = useState("json"); // "json" or "table"

//   const handleFileUpload = (e) => {
//     const file = e.target.files[0];
//     if (!file) return;
    
//     // Reset states
//     setJsonData([]);
//     setLoading(true);
//     setProgress(0);
//     setFileName(file.name);
    
//     // Set immediate metadata
//     setMetadata({
//       name: file.name,
//       size: (file.size / 1024 / 1024).toFixed(2) + " MB",
//       type: file.type,
//       lastModified: new Date(file.lastModified).toLocaleString(),
//       totalRows: "Processing...",
//       columns: "Processing...",
//     });

//     // Parse directly without FileReader
//     Papa.parse(file, {
//       header: true,
//       skipEmptyLines: true,
//       worker: true, // Use a worker thread for large files
//       step: function(row) {
//         // Process each row
//         if (row && row.data) {
//           setProgress((row.meta.cursor / file.size) * 100);
//         }
//       },
//       complete: function(results) {
//         try {
//           if (results && Array.isArray(results.data)) {
//             const validData = results.data.filter(row => Object.keys(row).length > 0);
            
//             if (validData.length > 0) {
//               setJsonData(validData);
//               setMetadata(prev => ({
//                 ...prev,
//                 totalRows: validData.length,
//                 columns: Object.keys(validData[0]).length,
//                 headers: Object.keys(validData[0]),
//               }));
//             } else {
//               throw new Error("No valid data found in CSV");
//             }
//           } else {
//             throw new Error("Invalid CSV format");
//           }
//         } catch (error) {
//           console.error("Error processing CSV:", error);
//           setMetadata(prev => ({
//             ...prev,
//             totalRows: "Error: Invalid data",
//             columns: "Error: Invalid data",
//           }));
//         }
//         setLoading(false);
//         setProgress(100);
//       },
//       error: function(error) {
//         console.error("Error parsing CSV:", error);
//         setMetadata(prev => ({
//           ...prev,
//           totalRows: "Error parsing file",
//           columns: "Error parsing file",
//         }));
//         setLoading(false);
//       }
//     });
//   };

//   // Clear input value on mount to prevent the relaunch issue
//   React.useEffect(() => {
//     const input = document.getElementById('csvInput') as HTMLInputElement;
//     if (input) {
//       input.value = '';
//     }
//   }, []);

//   return (
//     <div className="h-screen">
//       <div className="p-6 max-w-4xl mx-auto space-y-6">
//         <h1 className="text-2xl font-bold text-center">
//           CSV → JSON Converter & Viewer
//         </h1>

//         <div className="flex items-center justify-center">
//           <Button 
//             onClick={() => document.getElementById('csvInput').click()}
//             className="relative"
//             disabled={loading}
//           >
//             {loading ? "Processing..." : "Select CSV File"}
//             <input
//               id="csvInput"
//               type="file"
//               accept=".csv"
//               onChange={handleFileUpload}
//               className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
//               disabled={loading}
//             />
//           </Button>
//         </div>

//         {loading && (
//           <div className="space-y-2">
//             <Progress value={progress} className="w-full" />
//             <p className="text-center text-sm text-gray-500">
//               Processing: {progress.toFixed(0)}%
//             </p>
//           </div>
//         )}

//         {metadata && (
//           <Card className="p-4">
//             <CardContent>
//               <h2 className="text-lg font-semibold mb-2">File Metadata</h2>
//               <div className="grid grid-cols-2 gap-2 text-sm">
//                 <p>File Name: {metadata.name}</p>
//                 <p>Size: {metadata.size}</p>
//                 <p>Total Rows: {metadata.totalRows || "Processing..."}</p>
//                 <p>Columns: {metadata.columns || "Processing..."}</p>
//               </div>
//             </CardContent>
//           </Card>
//         )}

//         {jsonData.length > 0 && (
//           <>
//             <div className="flex justify-end space-x-2">
//               <Toggle
//                 pressed={viewMode === "json"}
//                 onPressedChange={() => setViewMode("json")}
//               >
//                 JSON View
//               </Toggle>
//               <Toggle
//                 pressed={viewMode === "table"}
//                 onPressedChange={() => setViewMode("table")}
//               >
//                 Table View
//               </Toggle>
//             </div>

//             <Card className="p-4 shadow-md">
//               <CardContent>
//                 {viewMode === "json" ? (
//                   <pre className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 text-xs overflow-x-auto max-h-[400px]">
//                     {JSON.stringify(jsonData, null, 2)}
//                   </pre>
//                 ) : (
//                   <div className="overflow-x-auto max-h-[400px]">
//                     <Table>
//                       <TableHeader>
//                         <TableRow>
//                           {Object.keys(jsonData[0] || {}).map((header) => (
//                             <TableHead key={header}>{header}</TableHead>
//                           ))}
//                         </TableRow>
//                       </TableHeader>
//                       <TableBody>
//                         {jsonData.map((row, index) => (
//                           <TableRow key={index}>
//                             {Object.values(row).map((value, i) => (
//                               <TableCell key={i}>{value}</TableCell>
//                             ))}
//                           </TableRow>
//                         ))}
//                       </TableBody>
//                     </Table>
//                   </div>
//                 )}
//               </CardContent>
//             </Card>
//           </>
//         )}
//       </div>
//     </div>
//   );
// }

// "use client";
// import React, { useState, useEffect } from "react";
// import Papa from "papaparse";
// import { Card, CardContent } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Progress } from "@/components/ui/progress";
// import { Toggle } from "@/components/ui/toggle";
// import {
//   Table,
//   TableBody,
//   TableCell,
//   TableHead,
//   TableHeader,
//   TableRow,
// } from "@/components/ui/table";

// export default function DataPage() {
//   const [jsonData, setJsonData] = useState([]);
//   const [fileName, setFileName] = useState("");
//   const [loading, setLoading] = useState(false);
//   const [progress, setProgress] = useState(0);
//   const [metadata, setMetadata] = useState(null);
//   const [viewMode, setViewMode] = useState("json"); // "json" or "table"

//   const handleFileUpload = (e) => {
//     const file = e.target.files[0];
//     if (!file) return;

//     setJsonData([]);
//     setLoading(true);
//     setProgress(0);
//     setFileName(file.name);

//     setMetadata({
//       name: file.name,
//       size: (file.size / 1024 / 1024).toFixed(2) + " MB",
//       type: file.type,
//       lastModified: new Date(file.lastModified).toLocaleString(),
//       totalRows: "Processing...",
//       columns: "Processing...",
//     });

//     Papa.parse(file, {
//       header: true,
//       skipEmptyLines: true,
//       dynamicTyping: true,
//       worker: true,
//       complete: function (results) {
//         try {
//           const validData = results.data.filter(
//             (row) =>
//               row &&
//               Object.keys(row).length > 0 &&
//               Object.values(row).some((v) => v !== null && v !== "")
//           );

//           if (validData.length > 0) {
//             setJsonData(validData);
//             setMetadata((prev) => ({
//               ...prev,
//               totalRows: validData.length,
//               columns: Object.keys(validData[0]).length,
//               headers: Object.keys(validData[0]),
//             }));
//           } else {
//             throw new Error("No valid rows in CSV file.");
//           }
//         } catch (error) {
//           console.error("Error processing CSV:", error);
//           setMetadata((prev) => ({
//             ...prev,
//             totalRows: "Error: Invalid CSV data",
//             columns: "Error: Invalid CSV data",
//           }));
//         }
//         setLoading(false);
//         setProgress(100);
//       },
//       error: function (error) {
//         console.error("Error parsing CSV:", error);
//         setMetadata((prev) => ({
//           ...prev,
//           totalRows: "Error parsing file",
//           columns: "Error parsing file",
//         }));
//         setLoading(false);
//       },
//     });
//   };

//   useEffect(() => {
//     const input = document.getElementById("csvInput");
//     if (input) input.value = "";
//   }, []);

//   return (
//     <div className="h-screen">
//       <div className="p-6 max-w-4xl mx-auto space-y-6">
//         <h1 className="text-2xl font-bold text-center">
//           CSV → JSON Converter & Viewer
//         </h1>

//         <div className="flex items-center justify-center">
//           <div className="relative">
//             <Button
//               onClick={() => document.getElementById("csvInput").click()}
//               disabled={loading}
//             >
//               {loading ? "Processing..." : "Select CSV File"}
//             </Button>
//             <input
//               id="csvInput"
//               type="file"
//               accept=".csv"
//               onChange={handleFileUpload}
//               className="hidden" // Changed from absolute positioning to hidden
//               disabled={loading}
//             />
//           </div>
//         </div>

//         {loading && (
//           <div className="space-y-2">
//             <Progress value={progress} className="w-full" />
//             <p className="text-center text-sm text-gray-500">
//               Processing: {progress.toFixed(0)}%
//             </p>
//           </div>
//         )}

//         {metadata && (
//           <Card className="p-4">
//             <CardContent>
//               <h2 className="text-lg font-semibold mb-2">File Metadata</h2>
//               <div className="grid grid-cols-2 gap-2 text-sm">
//                 <p>File Name: {metadata.name}</p>
//                 <p>Size: {metadata.size}</p>
//                 <p>Total Rows: {metadata.totalRows}</p>
//                 <p>Columns: {metadata.columns}</p>
//               </div>
//             </CardContent>
//           </Card>
//         )}

//         {jsonData.length > 0 && (
//           <>
//             <div className="flex justify-end space-x-2">
//               <Toggle
//                 pressed={viewMode === "json"}
//                 onPressedChange={() => setViewMode("json")}
//               >
//                 JSON View
//               </Toggle>
//               <Toggle
//                 pressed={viewMode === "table"}
//                 onPressedChange={() => setViewMode("table")}
//               >
//                 Table View
//               </Toggle>
//             </div>

//             <Card className="p-4 shadow-md">
//               <CardContent>
//                 {viewMode === "json" ? (
//                   <pre className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 text-xs overflow-x-auto max-h-[400px]">
//                     {JSON.stringify(jsonData, null, 2)}
//                   </pre>
//                 ) : (
//                   <div className="overflow-x-auto max-h-[400px]">
//                     <Table>
//                       <TableHeader>
//                         <TableRow>
//                           {Object.keys(jsonData[0] || {}).map((header) => (
//                             <TableHead key={header}>{header}</TableHead>
//                           ))}
//                         </TableRow>
//                       </TableHeader>
//                       <TableBody>
//                         {jsonData.map((row, index) => (
//                           <TableRow key={index}>
//                             {Object.values(row).map((value, i) => (
//                               <TableCell key={i}>{value}</TableCell>
//                             ))}
//                           </TableRow>
//                         ))}
//                       </TableBody>
//                     </Table>
//                   </div>
//                 )}
//               </CardContent>
//             </Card>
//           </>
//         )}
//       </div>
//     </div>
//   );
// }


"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import dynamic from 'next/dynamic';
import Papa from "papaparse";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Toggle } from "@/components/ui/toggle";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";

// Dynamic import for react-window
const DynamicVirtualList = dynamic(
  () => import('react-window').then((mod) => mod.FixedSizeList),
  { 
    ssr: false,
    loading: () => <div>Loading virtualized list...</div>
  }
);

export default function DataPage() {
  const [jsonData, setJsonData] = useState([]);
  const [fileName, setFileName] = useState("");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [metadata, setMetadata] = useState(null);
  const [viewMode, setViewMode] = useState<"json" | "table">("json");
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setError(null);
      const file = e.target.files?.[0];
      if (!file) return;

      if (!file.name.endsWith('.csv')) {
        toast.error('Please select a CSV file');
        return;
      }

      setLoading(true);
      setProgress(0);
      setFileName(file.name);
      setMetadata({
        name: file.name,
        size: (file.size / 1024 / 1024).toFixed(2) + " MB",
        type: file.type,
        lastModified: new Date(file.lastModified).toLocaleString(),
        totalRows: "Processing...",
        columns: "Processing...",
      });

      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: true,
        worker: true,
        complete: async function (results) {
          try {
            const validData = results.data.filter(
              (row) =>
                row &&
                Object.keys(row).length > 0 &&
                Object.values(row).some((v) => v !== null && v !== "")
            );

            // Save to MongoDB
            try {
              const response = await fetch('/api/welldata', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(validData)
              });

              if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to save data');
              }

              const result = await response.json();
              if (!result.success) {
                throw new Error(result.error || 'Failed to save data');
              }

              toast.success(`Successfully saved ${result.count} records`);
            } catch (error) {
              console.error("Error saving data:", error);
              toast.error(error.message || 'Failed to save data');
              setError(error.message || 'Failed to save data');
            }

            // Update UI
            setJsonData(validData);
            setMetadata((prev) => ({
              ...prev,
              totalRows: validData.length,
              columns: Object.keys(validData[0] || {}).length,
            }));
          } catch (error) {
            console.error("Error processing CSV:", error);
            setMetadata((prev) => ({
              ...prev,
              totalRows: "Error: Invalid CSV data",
              columns: "Error: Invalid CSV data",
            }));
          } finally {
            setLoading(false);
            setProgress(100);
          }
        },
        error: function (error) {
          console.error("Error parsing CSV:", error);
          setLoading(false);
          toast.error('Error parsing CSV file');
        },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setLoading(false);
    }
  };

  useEffect(() => {
    const input = document.getElementById("csvInput");
    if (input) input.value = "";
  }, []);

  // Define interfaces
  interface VirtualListProps {
    data: any[];
  }

  // Create separate components
  const JsonVirtualList = ({ data }: { data: any[] }) => {
    const [isMounted, setIsMounted] = useState(false);
    const [width, setWidth] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      setIsMounted(true);
      if (containerRef.current) {
        setWidth(containerRef.current.offsetWidth);
      }
    }, []);

    if (!isMounted) return null;

    return (
      <div ref={containerRef} className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 h-[400px]">
        <DynamicVirtualList
          height={400}
          width={width || "100%"}
          itemCount={data.length}
          itemSize={35}
        >
          {({ index, style }) => (
            <div style={style} className="text-xs font-mono px-4">
              {JSON.stringify(data[index], null, 2)}
            </div>
          )}
        </DynamicVirtualList>
      </div>
    );
  };

  const TableVirtualList = ({ data }: { data: any[] }) => {
    const [isMounted, setIsMounted] = useState(false);
    const [width, setWidth] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      setIsMounted(true);
      if (containerRef.current) {
        setWidth(containerRef.current.offsetWidth);
      }
    }, []);

    if (!isMounted) return null;

    return (
      <div ref={containerRef} className="h-[400px]">
        <DynamicVirtualList
          height={400}
          width={width || "100%"}
          itemCount={data.length}
          itemSize={35}
        >
          {({ index, style }) => (
            <div style={style} className="flex">
              {Object.values(data[index]).map((value: any, i: number) => (
                <TableCell key={i} className="flex-1">
                  {String(value)}
                </TableCell>
              ))}
            </div>
          )}
        </DynamicVirtualList>
      </div>
    );
  };

  return (
    <div className="h-screen">
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-center">
          CSV/PDF → JSON Converter & Viewer
        </h1>

        <div className="flex items-center justify-center">
          <div className="relative">
            <Button
              onClick={() => document.getElementById("csvInput").click()}
              disabled={loading}
            >
              {loading ? "Processing..." : "Select CSV or PDF File"}
            </Button>
            <input
              id="csvInput"
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="hidden"
              disabled={loading}
            />
          </div>
        </div>

        {loading && (
          <div className="space-y-2">
            <Progress value={progress} className="w-full" />
            <p className="text-center text-sm text-gray-500">
              Processing: {progress.toFixed(0)}%
            </p>
          </div>
        )}

        {metadata && (
          <Card className="p-4">
            <CardContent>
              <h2 className="text-lg font-semibold mb-2">File Metadata</h2>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <p>File Name: {metadata.name}</p>
                <p>Size: {metadata.size}</p>
                <p>Total Rows: {metadata.totalRows}</p>
                <p>Columns: {metadata.columns}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {error && (
          <div className="p-4 mb-4 text-sm text-red-500 bg-red-50 rounded-md">
            {error}
          </div>
        )}

        {jsonData.length > 0 && (
          <>
            <div className="flex justify-end space-x-2">
              <Toggle
                pressed={viewMode === "json"}
                onPressedChange={() => setViewMode("json")}
              >
                JSON View
              </Toggle>
              <Toggle
                pressed={viewMode === "table"}
                onPressedChange={() => setViewMode("table")}
              >
                Table View
              </Toggle>
            </div>

            <Card className="p-4 shadow-md">
              <CardContent>
                {viewMode === "json" ? (
                  <pre className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 text-sm overflow-x-auto max-h-[600px]">
                    {JSON.stringify(jsonData, (key, value) => {
                      // Handle undefined and null values
                      if (value === undefined) return 'undefined';
                      if (value === null) return 'null';
                      return value;
                    }, 2)}
                  </pre>
                ) : (
                  <div className="overflow-x-auto max-h-[600px]">
                    <Table>
                      <TableHeader className="sticky top-0 bg-background z-10">
                        <TableRow>
                          {Object.keys(jsonData[0] || {}).map((header) => (
                            <TableHead key={header} className="font-semibold">
                              {header}
                            </TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {jsonData.map((row, index) => (
                          <TableRow key={index}>
                            {Object.values(row).map((value, i) => (
                              <TableCell 
                                key={i} 
                                className="max-w-[200px] truncate"
                                title={String(value)} // Shows full content on hover
                              >
                                {String(value)}
                              </TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
