import React from 'react';
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface DataViewerProps {
  data: any[];
  viewMode: 'json' | 'table';
}

export function DataViewer({ data, viewMode }: DataViewerProps) {
  // Format JSON for better readability
  const formatJSON = (obj: any) => {
    return JSON.stringify(obj, null, 2);
  };

  if (viewMode === 'json') {
    return (
      <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
        <pre className="overflow-x-auto whitespace-pre-wrap text-sm">
          {formatJSON(data)}
        </pre>
      </div>
    );
  }

  // Table view
  const headers = data.length > 0 ? Object.keys(data[0]) : [];
  
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            {headers.map((header) => (
              <TableHead key={header} className="font-semibold">
                {header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.slice(0, 100).map((row, index) => ( // Limit initial render to 100 rows
            <TableRow key={index}>
              {headers.map((header) => (
                <TableCell key={`${index}-${header}`}>
                  {String(row[header] ?? '')}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}