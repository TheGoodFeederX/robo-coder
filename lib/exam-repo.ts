import type { QueryFn } from "./db"
import { DEFAULT_EXAM_ID, examToRow, rowToExam, rowToResult, type ExamRow, type ResultRow } from "./db"
import type { Exam, ExamResult } from "./exam"

export async function fetchExam(sql: QueryFn, id = DEFAULT_EXAM_ID): Promise<Exam | null> {
  const rows = await sql<ExamRow>`
    select id, title, pass_mark, players, tasks, updated_at
    from exams where id = ${id} limit 1
  `
  return rows.length ? rowToExam(rows[0]) : null
}

export async function storeExam(sql: QueryFn, exam: Exam, id = DEFAULT_EXAM_ID): Promise<Exam> {
  const values = examToRow(exam)
  const rows = await sql<ExamRow>`
    insert into exams (id, title, pass_mark, players, tasks, updated_at)
    values (${id}, ${values.title}, ${values.pass_mark}, ${values.players}::jsonb, ${values.tasks}::jsonb, now())
    on conflict (id) do update set
      title = excluded.title,
      pass_mark = excluded.pass_mark,
      players = excluded.players,
      tasks = excluded.tasks,
      updated_at = now()
    returning id, title, pass_mark, players, tasks, updated_at
  `
  return rowToExam(rows[0])
}

export async function listResults(sql: QueryFn, limit = 200): Promise<ExamResult[]> {
  const rows = await sql<ResultRow>`
    select id, player_name, exam_title, score, total, passed, per_task, created_at
    from exam_results order by created_at desc limit ${limit}
  `
  return rows.map(rowToResult)
}

export async function addResult(sql: QueryFn, result: ExamResult, examId = DEFAULT_EXAM_ID): Promise<ExamResult> {
  const rows = await sql<ResultRow>`
    insert into exam_results (player_name, exam_id, exam_title, score, total, passed, per_task)
    values (${result.playerName}, ${examId}, ${result.examTitle}, ${result.score}, ${result.total}, ${result.passed}, ${JSON.stringify(result.perTask)}::jsonb)
    returning id, player_name, exam_title, score, total, passed, per_task, created_at
  `
  return rowToResult(rows[0])
}

export async function clearResults(sql: QueryFn): Promise<number> {
  const rows = await sql<{ count: string }>`with deleted as (delete from exam_results returning 1) select count(*)::text as count from deleted`
  return Number(rows[0]?.count ?? 0)
}
