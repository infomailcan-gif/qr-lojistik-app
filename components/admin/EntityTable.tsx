import { ReactNode } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";

interface EntityTableProps {
  headers: string[];
  children: ReactNode;
  emptyMessage?: string;
}

export function EntityTable({
  headers,
  children,
  emptyMessage = "Veri bulunamadı",
}: EntityTableProps) {
  return (
    <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-sm">
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-slate-200 hover:bg-transparent bg-slate-50">
                {headers.map((header, index) => (
                  <TableHead
                    key={index}
                    className="text-slate-600 font-semibold"
                  >
                    {header}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {children || (
                <TableRow>
                  <TableCell
                    colSpan={headers.length}
                    className="text-center text-slate-500 py-12"
                  >
                    {emptyMessage}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
