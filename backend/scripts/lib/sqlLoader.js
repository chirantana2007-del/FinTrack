const fs = require("fs");

// Splits a .sql file into statements the way the mysql CLI does, so the
// project's schema/procedures/triggers/seed files can be loaded through
// mysql2. Handles `DELIMITER $$` switches (used around routines and
// triggers), quoted strings, and -- / # / /* */ comments.
function splitSqlStatements(sql) {
  const statements = [];
  let delimiter = ";";
  let current = "";
  let i = 0;

  const flush = () => {
    const statement = current.trim();
    if (statement) statements.push(statement);
    current = "";
  };

  while (i < sql.length) {
    // DELIMITER is a client directive: only recognized at the start of a line.
    const atLineStart = i === 0 || sql[i - 1] === "\n";
    if (atLineStart) {
      const match = /^[ \t]*DELIMITER[ \t]+(\S+)[ \t]*\r?(\n|$)/i.exec(sql.slice(i));
      if (match) {
        flush();
        delimiter = match[1];
        i += match[0].length;
        continue;
      }
    }

    const ch = sql[i];
    const next = sql[i + 1];

    if ((ch === "-" && next === "-") || ch === "#") {
      const end = sql.indexOf("\n", i);
      i = end === -1 ? sql.length : end + 1;
      current += "\n";
      continue;
    }

    if (ch === "/" && next === "*") {
      const end = sql.indexOf("*/", i + 2);
      i = end === -1 ? sql.length : end + 2;
      current += " ";
      continue;
    }

    if (ch === "'" || ch === '"' || ch === "`") {
      let j = i + 1;
      while (j < sql.length) {
        if (sql[j] === "\\") {
          j += 2;
          continue;
        }
        if (sql[j] === ch) {
          if (sql[j + 1] === ch) {
            j += 2; // doubled quote inside a string
            continue;
          }
          break;
        }
        j += 1;
      }
      current += sql.slice(i, j + 1);
      i = j + 1;
      continue;
    }

    if (sql.startsWith(delimiter, i)) {
      flush();
      i += delimiter.length;
      continue;
    }

    current += ch;
    i += 1;
  }

  flush();
  return statements;
}

async function runSqlFile(connection, filePath) {
  const sql = fs.readFileSync(filePath, "utf8").replace(/^﻿/, "");
  for (const statement of splitSqlStatements(sql)) {
    await connection.query(statement);
  }
}

module.exports = { splitSqlStatements, runSqlFile };
