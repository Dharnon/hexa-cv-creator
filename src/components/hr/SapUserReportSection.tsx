import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Check,
  ChevronsUpDown,
  Download,
  FileSpreadsheet,
  Loader2,
  Search,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

const SAP_API_BASE = import.meta.env.VITE_SAP_API_URL?.replace(/\/$/, "") || "/sap-api";

interface SapEmployee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface SapProjectRow {
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  projectId: string;
  projectName: string;
  year: number | null;
  client: string | null;
  totalHours: number;
}

async function exportSapReportToExcel(rows: SapProjectRow[], employee: SapEmployee) {
  const { default: ExcelJS } = await import("exceljs");
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Informe SAP");

  worksheet.columns = [
    { header: "SAP ID", key: "employeeId", width: 14 },
    { header: "Nombre", key: "firstName", width: 16 },
    { header: "Apellidos", key: "lastName", width: 20 },
    { header: "Email", key: "email", width: 30 },
    { header: "Ano", key: "year", width: 8 },
    { header: "Codigo proyecto", key: "projectId", width: 18 },
    { header: "Proyecto", key: "projectName", width: 48 },
    { header: "Cliente", key: "client", width: 24 },
    { header: "Horas totales", key: "totalHours", width: 14 },
  ];

  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF1E293B" },
  };

  rows.forEach((row) => {
    worksheet.addRow({
      ...row,
      client: row.client ?? "-",
      year: row.year ?? "",
    });
  });

  worksheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: worksheet.columns.length },
  };

  worksheet.getColumn("totalHours").numFmt = "0.0";

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  const safeName = `${employee.firstName}_${employee.lastName}`.trim().replace(/\s+/g, "_");
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `informe_sap_${employee.id}_${safeName}.xlsx`;
  link.click();
  URL.revokeObjectURL(url);
}

export function SapUserReportSection() {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState<SapEmployee | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    if (!open) {
      setSearchQuery("");
    }
  }, [open]);

  const {
    data: employees = [],
    isLoading: loadingEmployees,
    isError: employeesError,
  } = useQuery<SapEmployee[]>({
    queryKey: ["sap-employees"],
    queryFn: async () => {
      const response = await fetch(`${SAP_API_BASE}/api/maringo/employees`);
      if (!response.ok) {
        throw new Error("No se pudieron cargar los empleados de SAP.");
      }

      return response.json();
    },
    staleTime: 1000 * 60 * 60,
  });

  const filteredEmployees = useMemo(() => {
    if (!open) {
      return [];
    }

    const normalizedQuery = searchQuery.trim().toLowerCase();
    if (!normalizedQuery) {
      return employees.slice(0, 15);
    }

    return employees
      .filter((employee) => {
        const fullName = `${employee.firstName} ${employee.lastName}`.toLowerCase();
        return (
          fullName.includes(normalizedQuery) ||
          employee.email.toLowerCase().includes(normalizedQuery) ||
          employee.id.toLowerCase().includes(normalizedQuery)
        );
      })
      .slice(0, 50);
  }, [employees, open, searchQuery]);

  const {
    data: reportRows = [],
    isLoading: loadingReport,
    isFetching,
    isError: reportError,
  } = useQuery<SapProjectRow[]>({
    queryKey: ["sap-user-project-report", selectedEmployee?.id],
    queryFn: async () => {
      const response = await fetch(
        `${SAP_API_BASE}/api/maringo/user-project-report?employeeId=${selectedEmployee?.id}`,
      );
      if (!response.ok) {
        throw new Error("No se pudo cargar el informe SAP.");
      }

      return response.json();
    },
    enabled: !!selectedEmployee,
  });

  const totalHours = useMemo(
    () => reportRows.reduce((sum, row) => sum + row.totalHours, 0),
    [reportRows],
  );

  const handleExport = async () => {
    if (!selectedEmployee || reportRows.length === 0) {
      return;
    }

    try {
      setIsExporting(true);
      await exportSapReportToExcel(reportRows, selectedEmployee);
      toast.success("Excel SAP exportado correctamente.");
    } catch (error) {
      console.error(error);
      toast.error("No se pudo generar el Excel SAP.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-2xl border bg-card p-6 shadow-sm lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold text-foreground">Informe de proyectos SAP</h2>
          </div>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Consulta por usuario el historial de proyectos externos y exporta el detalle a Excel usando el mini server local.
          </p>
          <p className="text-xs text-muted-foreground">
            Endpoint configurado: <span className="font-mono">{SAP_API_BASE}</span>
          </p>
        </div>

        <Button
          onClick={handleExport}
          disabled={!selectedEmployee || reportRows.length === 0 || isExporting}
          className="gap-2"
        >
          {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          Exportar Excel
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[380px_minmax(0,1fr)]">
        <div className="space-y-4 rounded-2xl border bg-card p-5 shadow-sm">
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">Empleado SAP</p>
            <p className="text-xs text-muted-foreground">Busca por nombre, email o SAP ID.</p>
          </div>

          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" role="combobox" className="w-full justify-between" disabled={loadingEmployees}>
                {selectedEmployee ? `${selectedEmployee.firstName} ${selectedEmployee.lastName}` : "Selecciona un empleado"}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[360px] p-0" align="start">
              <Command shouldFilter={false}>
                <CommandInput placeholder="Buscar empleado..." value={searchQuery} onValueChange={setSearchQuery} />
                <CommandList className="max-h-[300px]">
                  <CommandEmpty>No hay resultados.</CommandEmpty>
                  <CommandGroup>
                    {filteredEmployees.map((employee) => (
                      <CommandItem
                        key={employee.id}
                        value={employee.id}
                        onSelect={() => {
                          setSelectedEmployee(employee);
                          setOpen(false);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            selectedEmployee?.id === employee.id ? "opacity-100" : "opacity-0",
                          )}
                        />
                        <div className="min-w-0">
                          <p className="truncate font-medium">{employee.firstName} {employee.lastName}</p>
                          <p className="truncate text-xs text-muted-foreground">{employee.email} · {employee.id}</p>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>

          {selectedEmployee && (
            <div className="rounded-xl bg-muted/40 p-4 text-sm">
              <p className="font-medium text-foreground">{selectedEmployee.firstName} {selectedEmployee.lastName}</p>
              <p className="text-muted-foreground">{selectedEmployee.email}</p>
              <p className="font-mono text-xs text-muted-foreground">SAP ID: {selectedEmployee.id}</p>
            </div>
          )}

          {employeesError && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
              No se pudo conectar con el mini server SAP. Revisa que el backend local este levantado y con acceso a HANA.
            </div>
          )}
        </div>

        <div className="rounded-2xl border bg-card shadow-sm">
          {!selectedEmployee ? (
            <div className="flex min-h-[420px] flex-col items-center justify-center gap-4 px-6 text-center text-muted-foreground">
              <div className="rounded-full bg-muted p-6">
                <Search className="h-10 w-10" />
              </div>
              <div className="space-y-1">
                <p className="font-medium text-foreground">Selecciona un empleado para ver el informe SAP</p>
                <p className="text-sm">Mostraremos proyectos, cliente y horas totales por ano.</p>
              </div>
            </div>
          ) : (
            <div className="flex min-h-[420px] flex-col">
              <div className="flex flex-wrap items-center gap-3 border-b px-6 py-4">
                <Badge variant="secondary">{reportRows.length} proyectos</Badge>
                <Badge variant="outline">{totalHours.toFixed(1)} h totales</Badge>
                {(loadingReport || isFetching) && (
                  <span className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Cargando datos SAP...
                  </span>
                )}
              </div>

              {reportError ? (
                <div className="flex flex-1 items-center justify-center px-6 text-center text-sm text-destructive">
                  No se pudo obtener el informe del usuario seleccionado.
                </div>
              ) : reportRows.length === 0 && !loadingReport ? (
                <div className="flex flex-1 items-center justify-center px-6 text-center text-sm text-muted-foreground">
                  Este usuario no tiene horas imputadas en proyectos externos.
                </div>
              ) : (
                <div className="flex-1 overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>SAP ID</TableHead>
                        <TableHead>Nombre</TableHead>
                        <TableHead>Ano</TableHead>
                        <TableHead>Codigo</TableHead>
                        <TableHead>Proyecto</TableHead>
                        <TableHead>Cliente</TableHead>
                        <TableHead className="text-right">Horas</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reportRows.map((row) => (
                        <TableRow key={`${row.projectId}-${row.year}`}>
                          <TableCell className="font-mono text-xs">{row.employeeId}</TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{row.firstName} {row.lastName}</p>
                              <p className="text-xs text-muted-foreground">{row.email}</p>
                            </div>
                          </TableCell>
                          <TableCell>{row.year ?? "-"}</TableCell>
                          <TableCell className="font-mono text-xs">{row.projectId}</TableCell>
                          <TableCell className="max-w-[320px] truncate">{row.projectName}</TableCell>
                          <TableCell>{row.client ?? "-"}</TableCell>
                          <TableCell className="text-right font-semibold">{row.totalHours.toFixed(1)} h</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
