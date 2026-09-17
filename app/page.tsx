"use client";

import { useEffect, useState, type FormEvent } from "react";
import { PRIORITIES, PRIORITY_LABELS, DEFAULT_PRIORITY, type Priority } from "@/lib/priority";

type Todo = {
  id: number;
  title: string;
  completed: boolean;
  priority: Priority;
  createdAt: string;
};

type ApiResponse<T> = { data: T } | { error: { message: string } };

const PRIORITY_BADGE_CLASSES: Record<Priority, string> = {
  HIGH: "border-red-300 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300",
  MEDIUM:
    "border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300",
  LOW: "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
};

export default function Home() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<Priority>(DEFAULT_PRIORITY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadTodos() {
      const res = await fetch("/api/tasks");
      const body = (await res.json()) as ApiResponse<Todo[]>;
      if (cancelled) return;
      if ("data" in body) {
        setTodos(body.data);
        setError(null);
      } else {
        setError(body.error.message);
      }
      setLoading(false);
    }

    loadTodos();

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, priority }),
    });
    const body = (await res.json()) as ApiResponse<Todo>;
    if ("data" in body) {
      setTodos((prev) => [...prev, body.data]);
      setTitle("");
      setPriority(DEFAULT_PRIORITY);
      setError(null);
    } else {
      setError(body.error.message);
    }
  }

  async function handleToggle(todo: Todo) {
    const res = await fetch(`/api/tasks/${todo.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed: !todo.completed }),
    });
    const body = (await res.json()) as ApiResponse<Todo>;
    if ("data" in body) {
      setTodos((prev) => prev.map((t) => (t.id === todo.id ? body.data : t)));
      setError(null);
    } else {
      setError(body.error.message);
    }
  }

  async function handlePriorityChange(id: number, priority: Priority) {
    const res = await fetch(`/api/tasks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ priority }),
    });
    const body = (await res.json()) as ApiResponse<Todo>;
    if ("data" in body) {
      setTodos((prev) => prev.map((t) => (t.id === id ? body.data : t)));
      setError(null);
    } else {
      setError(body.error.message);
    }
  }

  async function handleDelete(id: number) {
    const res = await fetch(`/api/tasks/${id}`, { method: "DELETE" });
    const body = (await res.json()) as ApiResponse<{ id: number }>;
    if ("data" in body) {
      setTodos((prev) => prev.filter((t) => t.id !== id));
      setError(null);
    } else {
      setError(body.error.message);
    }
  }

  return (
    <div className="flex flex-col flex-1 items-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex flex-1 w-full max-w-xl flex-col gap-6 py-16 px-6">
        <h1 className="text-2xl font-semibold text-black dark:text-zinc-50">
          할 일 목록
        </h1>

        <form onSubmit={handleAdd} className="flex gap-2">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="새 할 일 입력"
            maxLength={200}
            className="flex-1 rounded border border-black/[.1] bg-white px-3 py-2 text-black dark:border-white/[.145] dark:bg-zinc-900 dark:text-zinc-50"
          />
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as Priority)}
            className="rounded border border-black/[.1] bg-white px-2 py-2 text-sm text-black dark:border-white/[.145] dark:bg-zinc-900 dark:text-zinc-50"
          >
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {PRIORITY_LABELS[p]}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="rounded bg-foreground px-4 py-2 text-background hover:bg-[#383838] dark:hover:bg-[#ccc]"
          >
            추가
          </button>
        </form>

        {error && (
          <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
            {error}
          </p>
        )}

        {loading ? (
          <p className="text-zinc-500">불러오는 중...</p>
        ) : todos.length === 0 ? (
          <p className="text-zinc-500">아직 할 일이 없습니다.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {todos.map((todo) => (
              <li
                key={todo.id}
                className="flex items-center gap-3 rounded border border-black/[.1] bg-white px-3 py-2 dark:border-white/[.145] dark:bg-zinc-900"
              >
                <input
                  type="checkbox"
                  checked={todo.completed}
                  onChange={() => handleToggle(todo)}
                  className="h-4 w-4"
                />
                <span
                  className={
                    todo.completed
                      ? "flex-1 text-zinc-400 line-through"
                      : "flex-1 text-black dark:text-zinc-50"
                  }
                >
                  {todo.title}
                </span>
                <select
                  value={todo.priority}
                  onChange={(e) => handlePriorityChange(todo.id, e.target.value as Priority)}
                  className={`rounded-full border px-2 py-1 text-xs font-medium ${PRIORITY_BADGE_CLASSES[todo.priority]}`}
                >
                  {PRIORITIES.map((p) => (
                    <option key={p} value={p}>
                      {PRIORITY_LABELS[p]}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => handleDelete(todo.id)}
                  className="rounded border border-black/[.08] px-2 py-1 text-sm text-zinc-600 hover:bg-black/[.04] dark:border-white/[.145] dark:text-zinc-300 dark:hover:bg-[#1a1a1a]"
                >
                  삭제
                </button>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
