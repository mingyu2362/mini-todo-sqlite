import { NextResponse } from "next/server";

export function jsonData<T>(data: T, status = 200) {
  return NextResponse.json({ data }, { status });
}

export function jsonError(message: string, status: number) {
  return NextResponse.json({ error: { message } }, { status });
}
