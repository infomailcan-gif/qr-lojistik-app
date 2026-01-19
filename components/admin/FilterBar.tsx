import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FilterBarProps {
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  departmentValue?: string;
  onDepartmentChange?: (value: string) => void;
  departments?: { id: string; name: string }[];
  userValue?: string;
  onUserChange?: (value: string) => void;
  users?: string[];
  statusValue?: string;
  onStatusChange?: (value: string) => void;
  dateFromValue?: string;
  onDateFromChange?: (value: string) => void;
  dateToValue?: string;
  onDateToChange?: (value: string) => void;
  onReset?: () => void;
}

export function FilterBar({
  searchValue = "",
  onSearchChange,
  departmentValue,
  onDepartmentChange,
  departments,
  userValue,
  onUserChange,
  users,
  statusValue,
  onStatusChange,
  dateFromValue,
  onDateFromChange,
  dateToValue,
  onDateToChange,
  onReset,
}: FilterBarProps) {
  const hasActiveFilters =
    searchValue ||
    departmentValue !== "all" ||
    userValue !== "all" ||
    statusValue !== "all" ||
    dateFromValue ||
    dateToValue;

  return (
    <div className="space-y-4 bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-lg p-4">
      {/* Search */}
      {onSearchChange && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Kod veya isim ile ara..."
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 bg-slate-800/50 border-slate-700 text-white"
          />
        </div>
      )}

      {/* Filters Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Department */}
        {departments && onDepartmentChange && (
          <div>
            <Label className="text-xs text-slate-400 mb-1.5 block">
              Departman
            </Label>
            <Select value={departmentValue} onValueChange={onDepartmentChange}>
              <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
                <SelectValue placeholder="Tümü" />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-800">
                <SelectItem value="all">Tümü</SelectItem>
                {departments.map((dept) => (
                  <SelectItem key={dept.id} value={dept.id}>
                    {dept.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* User */}
        {users && onUserChange && (
          <div>
            <Label className="text-xs text-slate-400 mb-1.5 block">
              Kullanıcı
            </Label>
            <Select value={userValue} onValueChange={onUserChange}>
              <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
                <SelectValue placeholder="Tümü" />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-800">
                <SelectItem value="all">Tümü</SelectItem>
                {users.map((user) => (
                  <SelectItem key={user} value={user}>
                    {user}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Status */}
        {onStatusChange && (
          <div>
            <Label className="text-xs text-slate-400 mb-1.5 block">Durum</Label>
            <Select value={statusValue} onValueChange={onStatusChange}>
              <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
                <SelectValue placeholder="Tümü" />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-800">
                <SelectItem value="all">Tümü</SelectItem>
                <SelectItem value="sealed">Kapalı</SelectItem>
                <SelectItem value="draft">Taslak</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Date From */}
        {onDateFromChange && (
          <div>
            <Label className="text-xs text-slate-400 mb-1.5 block">
              Başlangıç
            </Label>
            <Input
              type="date"
              value={dateFromValue}
              onChange={(e) => onDateFromChange(e.target.value)}
              className="bg-slate-800/50 border-slate-700 text-white"
            />
          </div>
        )}

        {/* Date To */}
        {onDateToChange && (
          <div>
            <Label className="text-xs text-slate-400 mb-1.5 block">Bitiş</Label>
            <Input
              type="date"
              value={dateToValue}
              onChange={(e) => onDateToChange(e.target.value)}
              className="bg-slate-800/50 border-slate-700 text-white"
            />
          </div>
        )}
      </div>

      {/* Reset Button */}
      {hasActiveFilters && onReset && (
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={onReset}
            className="border-slate-700 hover:bg-slate-800"
          >
            <X className="w-3 h-3 mr-1" />
            Filtreleri Temizle
          </Button>
        </div>
      )}
    </div>
  );
}





