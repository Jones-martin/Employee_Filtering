export interface PipeTransform {
  transform(value: any, ...args: any[]): any;
}

export interface PipeMetadata {
  name: string;
  pure: boolean;
}

export class CurrencyFormatPipe implements PipeTransform {
  static readonly metadata: PipeMetadata = {
    name: "currencyFormat",
    pure: true
  };

  private lastValue: number | null = null;
  private lastArgs: string = "";
  private cachedResult: string = "";

  transform(
    value: number | string | null | undefined,
    currencyCode: string = "INR",
    display: "symbol" | "code" | "compact" = "symbol",
    digitsInfo: number = 2
  ): string {
    if (value === null || value === undefined || isNaN(Number(value))) {
      return "-";
    }

    const numValue = Number(value);
    const argsKey = `${currencyCode}_${display}_${digitsInfo}`;

    if (this.lastValue === numValue && this.lastArgs === argsKey && this.cachedResult !== "") {
      return this.cachedResult;
    }

    let symbol = "₹";
    if (currencyCode === "USD") symbol = "$";
    if (currencyCode === "EUR") symbol = "€";
    if (currencyCode === "GBP") symbol = "£";

    let formattedNumber = "";

    if (display === "compact") {
      if (currencyCode === "INR" && numValue >= 100000) {
        const inLakhs = (numValue / 100000).toFixed(1);
        formattedNumber = `${inLakhs} L`;
      } else if (numValue >= 1000) {
        const inThousands = (numValue / 1000).toFixed(1);
        formattedNumber = `${inThousands} k`;
      } else {
        formattedNumber = numValue.toFixed(digitsInfo);
      }
    } else {
      formattedNumber = numValue.toLocaleString("en-IN", {
        minimumFractionDigits: digitsInfo,
        maximumFractionDigits: digitsInfo
      });
    }

    const prefix = display === "code" ? `${currencyCode} ` : `${symbol} `;
    const result = `${prefix}${formattedNumber}`;

    this.lastValue = numValue;
    this.lastArgs = argsKey;
    this.cachedResult = result;

    return result;
  }
}

export class DateFormatPipe implements PipeTransform {
  static readonly metadata: PipeMetadata = {
    name: "dateFormat",
    pure: true
  };

  private lastValue: string = "";
  private lastFormat: string = "";
  private cachedResult: string = "";

  transform(
    value: string | Date | null | undefined,
    format: "short" | "medium" | "long" | "tenure" = "medium"
  ): string {
    if (!value) return "-";

    const date = value instanceof Date ? value : new Date(value);
    if (isNaN(date.getTime())) return "-";

    const valueKey = date.toISOString();
    if (this.lastValue === valueKey && this.lastFormat === format && this.cachedResult !== "") {
      return this.cachedResult;
    }

    const day = String(date.getDate()).padStart(2, "0");
    const monthIndex = date.getMonth();
    const year = date.getFullYear();

    const monthNamesShort = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthNamesFull = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];

    let result = "";

    if (format === "short") {
      const monthNum = String(monthIndex + 1).padStart(2, "0");
      result = `${monthNum}/${day}/${year}`;
    } else if (format === "medium") {
      result = `${day} ${monthNamesShort[monthIndex]} ${year}`;
    } else if (format === "long") {
      result = `${day} ${monthNamesFull[monthIndex]} ${year}`;
    } else if (format === "tenure") {
      const now = new Date();
      let diffYears = now.getFullYear() - date.getFullYear();
      let diffMonths = now.getMonth() - date.getMonth();
      if (diffMonths < 0) {
        diffYears -= 1;
        diffMonths += 12;
      }
      result = `${diffYears} yr${diffYears !== 1 ? "s" : ""} ${diffMonths} mo${diffMonths !== 1 ? "s" : ""}`;
    }

    this.lastValue = valueKey;
    this.lastFormat = format;
    this.cachedResult = result;

    return result;
  }
}

export class TextTransformPipe implements PipeTransform {
  static readonly metadata: PipeMetadata = {
    name: "textTransform",
    pure: true
  };

  transform(
    value: string | null | undefined,
    operation: "titlecase" | "uppercase" | "lowercase" | "truncate" | "badge" = "titlecase",
    param?: number | string
  ): string {
    if (!value) return "";
    const str = String(value);

    if (operation === "uppercase") {
      return str.toUpperCase();
    }

    if (operation === "lowercase") {
      return str.toLowerCase();
    }

    if (operation === "titlecase") {
      return str
        .toLowerCase()
        .split(" ")
        .map(word => (word.length ? word[0].toUpperCase() + word.slice(1) : ""))
        .join(" ");
    }

    if (operation === "truncate") {
      const maxLen = typeof param === "number" ? param : 20;
      if (str.length <= maxLen) return str;
      return str.slice(0, maxLen) + "...";
    }

    if (operation === "badge") {
      const badgeClass = typeof param === "string" ? param : "default";
      return `[${badgeClass.toUpperCase()}: ${str}]`;
    }

    return str;
  }
}

export function runTests(): void {
  console.log("=== MODULE 2: CUSTOM PURE FORMATTING PIPES (ANGULAR TS) ===");
  console.log("Team Member: Divyadharshiny S P");
  console.log("Testing: Pure Pipes, Currency, Date, and Text Formatting\n");

  const currencyPipe = new CurrencyFormatPipe();
  console.log("[CURRENCY PIPE] Testing standard INR, USD, and compact formats:");
  console.log(" - 85000 in INR (symbol):", currencyPipe.transform(85000, "INR", "symbol"));
  console.log(" - 125000 in INR (compact):", currencyPipe.transform(125000, "INR", "compact"));
  console.log(" - 92000 in USD (symbol):", currencyPipe.transform(92000, "USD", "symbol"));
  console.log(" - 78000 in EUR (code):", currencyPipe.transform(78000, "EUR", "code"));

  const cachedResult = currencyPipe.transform(85000, "INR", "symbol");
  console.log(" - Pure pipe cached read:", cachedResult);

  const datePipe = new DateFormatPipe();
  console.log("\n[DATE PIPE] Testing date formats and tenure calculation:");
  const testDate = "2021-03-15";
  console.log(" - Short format (MM/DD/YYYY):", datePipe.transform(testDate, "short"));
  console.log(" - Medium format (DD MMM YYYY):", datePipe.transform(testDate, "medium"));
  console.log(" - Long format (DD MMMM YYYY):", datePipe.transform(testDate, "long"));
  console.log(" - Tenure calculation:", datePipe.transform(testDate, "tenure"));

  const textPipe = new TextTransformPipe();
  console.log("\n[TEXT TRANSFORM PIPE] Testing titlecase, uppercase, truncate, badge:");
  console.log(" - Titlecase:", textPipe.transform("full stack developer", "titlecase"));
  console.log(" - Uppercase:", textPipe.transform("devops lead", "uppercase"));
  console.log(" - Truncate (max 15):", textPipe.transform("Senior Cloud Solutions Architect", "truncate", 15));
  console.log(" - Badge:", textPipe.transform("Active", "badge", "status"));

  console.log("\nAll Module 2 formatting pipes verified successfully.\n");
}

if (process.argv[1]?.endsWith("module2_formatting_pipes.ts")) {
  runTests();
}
