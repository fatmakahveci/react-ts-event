"use client";

export default function ErrorBlock({ title, message }: { title: string, message: string }) {
    return (
      <div className="error-block">
        <div className="error-block-icon">!</div>
        <div className="error-block-text">
          <h2>{title}</h2>
          <p>{message}</p>
        </div>
      </div>
    );
  }
  