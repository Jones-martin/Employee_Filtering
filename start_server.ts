import http from "node:http";
import url from "node:url";
import type { QueryParams } from "./backend_api.ts";
import { queryEmployees } from "./backend_api.ts";

const PORT = 3000;

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url || "", true);
  const pathname = parsedUrl.pathname || "";


  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }


  if (pathname === "/api/employees" && req.method === "GET") {
    const q = parsedUrl.query;
    const params: QueryParams = {
      department: typeof q.department === "string" ? q.department : undefined,
      sortBy: typeof q.sortBy === "string" ? q.sortBy : undefined,
      order: q.order === "desc" ? "desc" : (q.order === "asc" ? "asc" : undefined),
      page: q.page ? parseInt(String(q.page), 10) : undefined,
      limit: q.limit ? parseInt(String(q.limit), 10) : undefined,
      search: typeof q.search === "string" ? q.search : undefined,
      minSalary: q.minSalary ? parseInt(String(q.minSalary), 10) : undefined,
      maxSalary: q.maxSalary ? parseInt(String(q.maxSalary), 10) : undefined
    };

    const response = queryEmployees(params);
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(response, null, 2));
    return;
  }


  if (pathname === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "healthy", timestamp: new Date().toISOString() }));
    return;
  }

  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ error: "Endpoint not found" }));
});

server.listen(PORT, () => {
  console.log(`Backend API server running at http://localhost:${PORT}`);
  console.log(`API Endpoint: http://localhost:${PORT}/api/employees`);
  console.log(`Angular frontend connects via proxy on port 4200`);
});
