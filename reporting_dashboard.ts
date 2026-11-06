import type { Employee, EmployeeResponse, QueryParams } from "./backend_api.ts";
import { EMPLOYEES, queryEmployees, createEmployeeServer } from "./backend_api.ts";
import { CurrencyFormatPipe, DateFormatPipe, TextTransformPipe } from "./formatting_pipes.ts";
import { EmployeeFilterPipe, EmployeeSortPipe } from "./filter_sort_pipes.ts";
import { EmployeeReportingTableComponent, PipeChain, BonusCalculatorPipe } from "./chaining_reporting.ts";

export interface DashboardSummary {
  totalEmployees: number;
  totalPayrollFormatted: string;
  averageSalaryFormatted: string;
  departmentBreakdown: Record<string, { count: number; totalSalary: string }>;
  topEarners: Array<{ name: string; salary: string; role: string }>;
}

export class EmployeeReportingDashboard {
  private currencyPipe = new CurrencyFormatPipe();
  private datePipe = new DateFormatPipe();
  private textPipe = new TextTransformPipe();
  private bonusPipe = new BonusCalculatorPipe();
  private filterPipe = new EmployeeFilterPipe();
  private sortPipe = new EmployeeSortPipe();
  private tableComponent = new EmployeeReportingTableComponent();

  public getDashboardSummary(employees: Employee[] = EMPLOYEES): DashboardSummary {
    const totalCount = employees.length;
    const totalSalary = employees.reduce((acc, curr) => acc + curr.salary, 0);
    const avgSalary = totalCount > 0 ? Math.round(totalSalary / totalCount) : 0;

    const deptMap: Record<string, { count: number; rawSalary: number }> = {};
    employees.forEach(emp => {
      if (!deptMap[emp.department]) {
        deptMap[emp.department] = { count: 0, rawSalary: 0 };
      }
      deptMap[emp.department].count += 1;
      deptMap[emp.department].rawSalary += emp.salary;
    });

    const departmentBreakdown: Record<string, { count: number; totalSalary: string }> = {};
    Object.keys(deptMap).forEach(dept => {
      departmentBreakdown[dept] = {
        count: deptMap[dept].count,
        totalSalary: this.currencyPipe.transform(deptMap[dept].rawSalary, "INR", "compact")
      };
    });

    const sortedBySalary = this.sortPipe.transform(employees, "salary", "desc");
    const topEarners = sortedBySalary.slice(0, 3).map(e => ({
      name: e.name,
      salary: this.currencyPipe.transform(e.salary, "INR", "symbol"),
      role: e.role
    }));

    return {
      totalEmployees: totalCount,
      totalPayrollFormatted: this.currencyPipe.transform(totalSalary, "INR", "symbol"),
      averageSalaryFormatted: this.currencyPipe.transform(avgSalary, "INR", "symbol"),
      departmentBreakdown,
      topEarners
    };
  }

  public runInteractiveReport(params: QueryParams = {}): {
    meta: EmployeeResponse["meta"];
    summary: DashboardSummary;
    renderedTableText: string;
    renderedHtml: string;
  } {
    const apiResponse = queryEmployees(params);
    const summary = this.getDashboardSummary(apiResponse.data);
    const reportRows = this.tableComponent.generateReportRows(
      apiResponse.data,
      undefined,
      (params.sortBy as keyof Employee) || "salary",
      params.order || "desc"
    );
    const renderedTableText = this.tableComponent.renderTextTable(reportRows);
    const renderedHtml = this.tableComponent.renderHtmlTable(reportRows);

    return {
      meta: apiResponse.meta,
      summary,
      renderedTableText,
      renderedHtml
    };
  }

  public generateFullHtmlPage(): string {
    const defaultData = queryEmployees({ page: 1, limit: 10 });
    const summary = this.getDashboardSummary(EMPLOYEES);
    const rows = this.tableComponent.generateReportRows(defaultData.data, undefined, "salary", "desc");
    const htmlTable = this.tableComponent.renderHtmlTable(rows).replace("<tbody>", '<tbody id="tableBody">');

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Employee Reporting Dashboard</title>
  <style>
    :root {
      --primary: #1e3a8a;
      --primary-light: #3b82f6;
      --bg: #f8fafc;
      --surface: #ffffff;
      --text: #1e293b;
      --text-muted: #64748b;
      --border: #e2e8f0;
      --success: #10b981;
      --warning: #f59e0b;
    }
    html, body, div, span, table, th, td, tr, input, select, button { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: var(--bg); color: var(--text); padding: 24px; }
    .header { background: linear-gradient(135deg, var(--primary), var(--primary-light)); color: white; padding: 24px 32px; border-radius: 12px; margin-bottom: 24px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
    .header h1 { font-size: 24px; font-weight: 700; }
    .header p { opacity: 0.9; margin-top: 6px; font-size: 14px; }
    .team-badge { display: inline-block; background: rgba(255,255,255,0.2); padding: 4px 12px; border-radius: 9999px; font-size: 12px; margin-top: 10px; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; margin-bottom: 24px; }
    .card { background: var(--surface); padding: 20px; border-radius: 10px; border: 1px solid var(--border); box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
    .card h3 { font-size: 13px; text-transform: uppercase; color: var(--text-muted); font-weight: 600; }
    .card .value { font-size: 26px; font-weight: 700; color: var(--primary); margin-top: 8px; }
    .controls { background: var(--surface); padding: 20px; border-radius: 10px; border: 1px solid var(--border); margin-bottom: 20px; display: flex; flex-wrap: wrap; gap: 12px; align-items: center; }
    .controls input, .controls select, .controls button { padding: 10px 14px; border: 1px solid var(--border); border-radius: 6px; font-size: 14px; }
    .controls input { flex: 1; min-width: 200px; }
    .controls button { background: var(--primary); color: white; font-weight: 600; cursor: pointer; border: none; }
    .controls button:hover { background: var(--primary-light); }
    .table-container { background: var(--surface); border-radius: 10px; border: 1px solid var(--border); overflow-x: auto; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
    table { width: 100%; border-collapse: collapse; text-align: left; }
    th { background: #f1f5f9; padding: 14px 18px; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted); border-bottom: 1px solid var(--border); }
    td { padding: 14px 18px; font-size: 14px; border-bottom: 1px solid var(--border); }
    tr:last-child td { border-bottom: none; }
    tr:hover { background: #f8fafc; }
    .numeric { text-align: right; font-variant-numeric: tabular-nums; }
    .highlight { font-weight: 600; color: var(--success); }
    .badge { display: inline-block; padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: 600; }
    .dept-it { background: #dbeafe; color: #1e40af; }
    .dept-finance { background: #dcfce7; color: #166534; }
    .dept-hr { background: #fef3c7; color: #92400e; }
    .dept-engineering { background: #f3e8ff; color: #6b21a8; }
    .dept-operations { background: #ffedd5; color: #9a3412; }
    .pagination { display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; background: var(--surface); border-top: 1px solid var(--border); border-radius: 0 0 10px 10px; }
    .pagination button { padding: 8px 14px; border: 1px solid var(--border); background: white; border-radius: 6px; cursor: pointer; font-size: 13px; }
    .pagination button:disabled { opacity: 0.5; cursor: not-allowed; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Employee Reporting Dashboard</h1>
    <p>Search, filter, sort, and review employee compensation data.</p>
  </div>

  <div class="grid">
    <div class="card">
      <h3>Total Employees</h3>
      <div class="value" id="kpiCount">${summary.totalEmployees}</div>
    </div>
    <div class="card">
      <h3>Total Annual Payroll</h3>
      <div class="value" id="kpiPayroll">${summary.totalPayrollFormatted}</div>
    </div>
    <div class="card">
      <h3>Average Base Salary</h3>
      <div class="value" id="kpiAvg">${summary.averageSalaryFormatted}</div>
    </div>
    <div class="card">
      <h3>Active Departments</h3>
      <div class="value" id="kpiDepts">${Object.keys(summary.departmentBreakdown).length}</div>
    </div>
  </div>

  <div class="controls">
    <input type="text" id="searchInput" placeholder="Search by name, role, email (e.g., Arun)..." oninput="filterData()">
    <select id="deptSelect" onchange="filterData()">
      <option value="ALL">All Departments</option>
      <option value="IT">IT</option>
      <option value="Finance">Finance</option>
      <option value="HR">HR</option>
      <option value="Engineering">Engineering</option>
      <option value="Operations">Operations</option>
    </select>
    <select id="sortSelect" onchange="filterData()">
      <option value="salary_desc">Salary (Highest to Lowest)</option>
      <option value="salary_asc">Salary (Lowest to Highest)</option>
      <option value="name_asc">Name (A-Z)</option>
      <option value="joinDate_desc">Join Date (Newest First)</option>
    </select>
    <button onclick="resetFilters()">Reset Filters</button>
  </div>

  <div class="table-container" id="tableContainer">
    ${htmlTable}
  </div>

  <div class="pagination">
    <span id="pageInfo">Showing page 1 of 1</span>
    <div>
      <button id="prevBtn" onclick="changePage(-1)" disabled>Previous</button>
      <button id="nextBtn" onclick="changePage(1)" disabled>Next</button>
    </div>
  </div>
  <script>
    const employees = ${JSON.stringify(EMPLOYEES)};
    let currentPage = 1;

    function formatCurrency(value) {
      return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(value);
    }

    function formatDate(value) {
      return new Intl.DateTimeFormat("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric"
      }).format(new Date(value)).toUpperCase();
    }

    function titleCase(value) {
      return value.toLowerCase().replace(/\\b\\w/g, character => character.toUpperCase());
    }

    function filterData(resetPage = true) {
      if (resetPage) currentPage = 1;
      const search = document.getElementById("searchInput").value.trim().toLowerCase();
      const department = document.getElementById("deptSelect").value;
      const sortValue = document.getElementById("sortSelect").value;
      const [sortBy, order] = sortValue.split("_");
      const filtered = employees.filter(employee => {
        const matchesDepartment = department === "ALL" || employee.department === department;
        const searchable = [employee.name, employee.department, employee.role, employee.email]
          .join(" ").toLowerCase();
        return matchesDepartment && (!search || searchable.includes(search));
      });

      filtered.sort((left, right) => {
        const first = left[sortBy];
        const second = right[sortBy];
        const direction = order === "desc" ? -1 : 1;
        if (typeof first === "number" && typeof second === "number") {
          return (first - second) * direction;
        }
        return String(first).localeCompare(String(second)) * direction;
      });

      const limit = 10;
      const totalPages = Math.max(1, Math.ceil(filtered.length / limit));
      currentPage = Math.min(Math.max(1, currentPage), totalPages);
      const pageRows = filtered.slice((currentPage - 1) * limit, currentPage * limit);
      const totalPayroll = filtered.reduce((sum, employee) => sum + employee.salary, 0);

      document.getElementById("kpiCount").textContent = String(filtered.length);
      document.getElementById("kpiPayroll").textContent = formatCurrency(totalPayroll);
      document.getElementById("kpiAvg").textContent = formatCurrency(filtered.length ? Math.round(totalPayroll / filtered.length) : 0);
      document.getElementById("kpiDepts").textContent = String(new Set(filtered.map(employee => employee.department)).size);
      document.getElementById("tableBody").innerHTML = pageRows.map(employee => {
        const totalCompensation = employee.salary * 1.12;
        return \`<tr>
          <td>\${employee.id}</td>
          <td><strong>\${titleCase(employee.name)}</strong></td>
          <td><span class="badge dept-\${employee.department.toLowerCase()}">\${employee.department.toUpperCase()}</span></td>
          <td>\${titleCase(employee.role)}</td>
          <td>\${formatDate(employee.joinDate)}</td>
          <td class="numeric">\${formatCurrency(employee.salary)}</td>
          <td class="numeric highlight">\${formatCurrency(totalCompensation)}</td>
          <td><span class="badge" style="background:#e0f2fe;color:#0369a1;">\${employee.status}</span></td>
        </tr>\`;
      }).join("");
      document.getElementById("pageInfo").textContent = \`Showing page \${currentPage} of \${totalPages} (\${filtered.length} total records)\`;
      document.getElementById("prevBtn").disabled = currentPage <= 1;
      document.getElementById("nextBtn").disabled = currentPage >= totalPages;
    }

    function resetFilters() {
      document.getElementById("searchInput").value = "";
      document.getElementById("deptSelect").value = "ALL";
      document.getElementById("sortSelect").value = "salary_desc";
      filterData();
    }

    function changePage(delta) {
      currentPage += delta;
      filterData(false);
    }

    document.getElementById("searchInput").addEventListener("input", () => filterData());
    document.getElementById("deptSelect").addEventListener("change", () => filterData());
    document.getElementById("sortSelect").addEventListener("change", () => filterData());
    filterData();
  </script>
</body>
</html>`;
  }
}

export function runTests(): void {
  console.log("=== MODULE 5: INTEGRATED REPORTING DASHBOARD (ANGULAR TS & NODE JS) ===");
  console.log("Team Member: Jones Martina");
  console.log("Testing: End-to-End Integrated Reporting Flow with Custom Pipes & API\n");

  const dashboard = new EmployeeReportingDashboard();

  console.log("[DASHBOARD KPI SUMMARY]");
  const summary = dashboard.getDashboardSummary(EMPLOYEES);
  console.log("Total Employees:", summary.totalEmployees);
  console.log("Total Payroll:", summary.totalPayrollFormatted);
  console.log("Average Salary:", summary.averageSalaryFormatted);
  console.log("Department Breakdown:");
  Object.keys(summary.departmentBreakdown).forEach(d => {
    console.log(` - ${d.padEnd(12)}: Count = ${summary.departmentBreakdown[d].count}, Total = ${summary.departmentBreakdown[d].totalSalary}`);
  });

  console.log("\n[QUERY REPORT: IT DEPARTMENT SORTED BY SALARY DESCENDING]");
  const itReport = dashboard.runInteractiveReport({ department: "IT", sortBy: "salary", order: "desc" });
  console.log(itReport.renderedTableText);

  console.log("\n[QUERY REPORT: SEARCH 'Arun' WITH PAGINATION]");
  const arunReport = dashboard.runInteractiveReport({ search: "Arun", page: 1, limit: 10 });
  console.log(arunReport.renderedTableText);

  console.log("\nAll Module 5 integrated dashboard tests completed successfully.\n");
}

if (process.argv[1]?.endsWith("module5_reporting_dashboard.ts")) {
  runTests();
}
