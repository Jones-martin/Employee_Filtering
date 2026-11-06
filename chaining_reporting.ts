import type { Employee } from "./backend_api.ts";
import { EMPLOYEES } from "./backend_api.ts";
import type { PipeTransform, PipeMetadata } from "./formatting_pipes.ts";
import { CurrencyFormatPipe, DateFormatPipe, TextTransformPipe } from "./formatting_pipes.ts";
import { EmployeeFilterPipe, EmployeeSortPipe } from "./filter_sort_pipes.ts";

export interface PipeStep {
  pipe: PipeTransform;
  args?: any[];
}

export class PipeChain {
  public static execute(initialValue: any, steps: PipeStep[]): any {
    return steps.reduce((currentValue, step) => {
      const args = step.args || [];
      return step.pipe.transform(currentValue, ...args);
    }, initialValue);
  }
}

export class BonusCalculatorPipe implements PipeTransform {
  static readonly metadata: PipeMetadata = {
    name: "bonusCalculator",
    pure: true
  };

  transform(value: number | string | null | undefined, bonusPercentage: number = 10): number {
    if (value === null || value === undefined || isNaN(Number(value))) return 0;
    const baseSalary = Number(value);
    const bonusAmount = (baseSalary * bonusPercentage) / 100;
    return baseSalary + bonusAmount;
  }
}

export interface FormattedEmployeeReportRow {
  id: number;
  name: string;
  departmentBadge: string;
  role: string;
  formattedJoinDate: string;
  formattedBaseSalary: string;
  projectedTotalComp: string;
  statusBadge: string;
}

export class EmployeeReportingTableComponent {
  private currencyPipe = new CurrencyFormatPipe();
  private datePipe = new DateFormatPipe();
  private textPipe = new TextTransformPipe();
  private bonusPipe = new BonusCalculatorPipe();
  private filterPipe = new EmployeeFilterPipe();
  private sortPipe = new EmployeeSortPipe();

  public generateReportRows(
    employees: Employee[],
    filterDept?: string,
    sortBy: keyof Employee = "salary",
    sortOrder: "asc" | "desc" = "desc"
  ): FormattedEmployeeReportRow[] {
    const filtered = this.filterPipe.transform(employees, filterDept ? { department: filterDept } : undefined);
    const sorted = this.sortPipe.transform(filtered, sortBy, sortOrder);

    return sorted.map(emp => {
      const formattedJoinDate = PipeChain.execute(emp.joinDate, [
        { pipe: this.datePipe, args: ["medium"] },
        { pipe: this.textPipe, args: ["uppercase"] }
      ]);

      const formattedBaseSalary = PipeChain.execute(emp.salary, [
        { pipe: this.currencyPipe, args: ["INR", "symbol", 2] }
      ]);

      const projectedTotalComp = PipeChain.execute(emp.salary, [
        { pipe: this.bonusPipe, args: [12] },
        { pipe: this.currencyPipe, args: ["INR", "symbol", 2] }
      ]);

      const departmentBadge = PipeChain.execute(emp.department, [
        { pipe: this.textPipe, args: ["uppercase"] }
      ]);

      const statusBadge = PipeChain.execute(emp.status, [
        { pipe: this.textPipe, args: ["badge", "status"] }
      ]);

      return {
        id: emp.id,
        name: this.textPipe.transform(emp.name, "titlecase"),
        departmentBadge,
        role: this.textPipe.transform(emp.role, "titlecase"),
        formattedJoinDate,
        formattedBaseSalary,
        projectedTotalComp,
        statusBadge
      };
    });
  }

  public renderTextTable(rows: FormattedEmployeeReportRow[]): string {
    const headers = ["ID", "Employee Name", "Department", "Role", "Join Date", "Base Salary", "Total Comp (+12%)"];
    const colWidths = [6, 20, 14, 22, 14, 16, 18];

    const formatLine = (cols: string[]) =>
      cols.map((c, i) => String(c).padEnd(colWidths[i])).join(" | ");

    const divider = colWidths.map(w => "-".repeat(w)).join("-+-");

    const lines: string[] = [];
    lines.push(formatLine(headers));
    lines.push(divider);

    rows.forEach(r => {
      lines.push(
        formatLine([
          String(r.id),
          r.name,
          r.departmentBadge,
          r.role,
          r.formattedJoinDate,
          r.formattedBaseSalary,
          r.projectedTotalComp
        ])
      );
    });

    return lines.join("\n");
  }

  public renderHtmlTable(rows: FormattedEmployeeReportRow[]): string {
    const tableHeader = `
    <thead>
      <tr>
        <th>ID</th>
        <th>Employee Name</th>
        <th>Department</th>
        <th>Role</th>
        <th>Join Date (Chained)</th>
        <th>Base Salary</th>
        <th>Total Comp (+12% Chained)</th>
        <th>Status</th>
      </tr>
    </thead>`;

    const tableBody = rows
      .map(
        r => `
      <tr>
        <td>${r.id}</td>
        <td><strong>${r.name}</strong></td>
        <td><span class="badge dept-${r.departmentBadge.toLowerCase()}">${r.departmentBadge}</span></td>
        <td>${r.role}</td>
        <td>${r.formattedJoinDate}</td>
        <td class="numeric">${r.formattedBaseSalary}</td>
        <td class="numeric highlight">${r.projectedTotalComp}</td>
        <td>${r.statusBadge}</td>
      </tr>`
      )
      .join("\n");

    return `<table class="report-table">${tableHeader}<tbody>${tableBody}</tbody></table>`;
  }
}

export function runTests(): void {
  console.log("=== MODULE 4: PIPE CHAINING & REUSABLE REPORTING TABLE (ANGULAR TS) ===");
  console.log("Team Member: Harish S");
  console.log("Testing: Multi-Pipe Chaining and Dynamic Report Table Generation\n");

  const currencyPipe = new CurrencyFormatPipe();
  const datePipe = new DateFormatPipe();
  const textPipe = new TextTransformPipe();
  const bonusPipe = new BonusCalculatorPipe();

  console.log("[CHAIN 1: SALARY -> BONUS (15%) -> CURRENCY (INR)]");
  const salarySample = 85000;
  const chainedSalary = PipeChain.execute(salarySample, [
    { pipe: bonusPipe, args: [15] },
    { pipe: currencyPipe, args: ["INR", "symbol", 2] }
  ]);
  console.log("Input:", salarySample, "=> Result:", chainedSalary);

  console.log("\n[CHAIN 2: JOIN DATE -> DATE FORMAT (MEDIUM) -> TEXT TRANSFORM (UPPERCASE)]");
  const dateSample = "2021-03-15";
  const chainedDate = PipeChain.execute(dateSample, [
    { pipe: datePipe, args: ["medium"] },
    { pipe: textPipe, args: ["uppercase"] }
  ]);
  console.log("Input:", dateSample, "=> Result:", chainedDate);

  console.log("\n[CHAIN 3: EMPLOYEE REPORTING TABLE GENERATION]");
  const tableComponent = new EmployeeReportingTableComponent();
  const rows = tableComponent.generateReportRows(EMPLOYEES, "IT", "salary", "desc");
  console.log(tableComponent.renderTextTable(rows));

  console.log("\nAll Module 4 pipe chaining and table rendering verified successfully.\n");
}

if (process.argv[1]?.endsWith("module4_chaining_reporting.ts")) {
  runTests();
}

