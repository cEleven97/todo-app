import { useState, useEffect, useCallback } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { invoke } from "@tauri-apps/api/core";
import "./App.css";

interface Todo {
  id: string;
  text: string;
  completed: boolean;
}

const STORAGE_KEY = "todo-app-items";

function loadTodos(): Todo[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveTodos(todos: Todo[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
}

function App() {
  const [todos, setTodos] = useState<Todo[]>(loadTodos);
  const [input, setInput] = useState("");
  const [alwaysOnTop, setAlwaysOnTop] = useState(true);
  const [opacity, setOpacity] = useState(1);

  useEffect(() => {
    saveTodos(todos);
  }, [todos]);

  const appWindow = getCurrentWindow();

  const addTodo = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed) return;
    const newTodo: Todo = {
      id: Date.now().toString(),
      text: trimmed,
      completed: false,
    };
    setTodos((prev) => [newTodo, ...prev]);
    setInput("");
  }, [input]);

  const toggleTodo = useCallback((id: string) => {
    setTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  }, []);

  const deleteTodo = useCallback((id: string) => {
    setTodos((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toggleAlwaysOnTop = useCallback(async () => {
    const next = !alwaysOnTop;
    setAlwaysOnTop(next);
    await appWindow.setAlwaysOnTop(next);
  }, [alwaysOnTop, appWindow]);

  const handleOpacityChange = useCallback(
    async (value: number) => {
      setOpacity(value);
      try {
        await invoke("set_window_alpha", { alpha: value });
      } catch (e) {
        console.error("set_window_alpha failed:", e);
      }
    },
    []
  );

  const completedCount = todos.filter((t) => t.completed).length;
  const totalCount = todos.length;

  return (
    <div className="app-shell">
      <div className="toolbar">
        <label className="toggle-row">
          <span className="toggle-label">置顶</span>
          <button
            className={`toggle-switch ${alwaysOnTop ? "active" : ""}`}
            onClick={toggleAlwaysOnTop}
          >
            <span className="toggle-knob" />
          </button>
        </label>

        <div className="opacity-row">
          <span className="toggle-label">
            透明度 {Math.round(opacity * 100)}%
          </span>
          <input
            type="range"
            className="opacity-slider"
            min="0.2"
            max="1"
            step="0.05"
            value={opacity}
            onChange={(e) => handleOpacityChange(parseFloat(e.target.value))}
          />
        </div>
      </div>

      <div className="add-todo-row">
        <input
          className="todo-input"
          type="text"
          placeholder="添加新任务..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addTodo()}
        />
        <button className="add-btn" onClick={addTodo}>
          +
        </button>
      </div>

      <div className="todo-list">
        {todos.length === 0 && (
          <div className="empty-hint">暂无任务，添加一条吧</div>
        )}
        {todos.map((todo) => (
          <div
            key={todo.id}
            className={`todo-item ${todo.completed ? "completed" : ""}`}
          >
            <button
              className={`check-circle ${todo.completed ? "checked" : ""}`}
              onClick={() => toggleTodo(todo.id)}
            >
              {todo.completed && (
                <svg width="12" height="12" viewBox="0 0 12 12">
                  <path
                    d="M2.5 6l2.5 2.5 4.5-5"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </button>
            <span className="todo-text" onClick={() => toggleTodo(todo.id)}>
              {todo.text}
            </span>
            <button
              className="delete-btn"
              onClick={() => deleteTodo(todo.id)}
            >
              <svg width="14" height="14" viewBox="0 0 14 14">
                <path
                  d="M3 3l8 8M11 3l-8 8"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>
        ))}
      </div>

      {totalCount > 0 && (
        <div className="status-bar">
          已完成 {completedCount}/{totalCount}
        </div>
      )}
    </div>
  );
}

export default App;
