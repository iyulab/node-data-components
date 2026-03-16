// src/components/u-rich-table/styles.ts
import { css } from 'lit';

export const richTableStyles = css`
  :host {
    display: block;
    font-family: system-ui, -apple-system, sans-serif;
    font-size: 13px;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    overflow: hidden;
  }

  .toolbar {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    background: #f8fafc;
    border-bottom: 1px solid #e2e8f0;
  }

  .toolbar .selection-info {
    font-size: 12px;
    color: #64748b;
  }

  .toolbar .search-input {
    padding: 4px 10px;
    border: 1px solid #d1d5db;
    border-radius: 4px;
    font-size: 12px;
    outline: none;
  }

  .toolbar .search-input:focus {
    border-color: #3b82f6;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
  }

  .toolbar .btn {
    padding: 4px 10px;
    border: none;
    border-radius: 4px;
    font-size: 12px;
    cursor: pointer;
    color: white;
  }

  .toolbar .btn-primary { background: #3b82f6; }
  .toolbar .btn-primary:hover { background: #2563eb; }
  .toolbar .btn-success { background: #10b981; }
  .toolbar .btn-success:hover { background: #059669; }

  table {
    width: 100%;
    border-collapse: collapse;
  }

  thead th {
    padding: 8px;
    background: #f1f5f9;
    font-weight: 600;
    text-align: left;
    border-bottom: 2px solid #e2e8f0;
    user-select: none;
    position: relative;
  }

  thead th.sortable {
    cursor: pointer;
  }

  thead th.sortable:hover {
    background: #e2e8f0;
  }

  .sort-indicator {
    font-size: 10px;
    color: #94a3b8;
    margin-left: 4px;
  }

  .filter-row td {
    padding: 4px;
    background: #fefce8;
    border-bottom: 1px solid #e2e8f0;
  }

  .filter-row input,
  .filter-row select {
    width: 100%;
    padding: 2px 6px;
    border: 1px solid #d1d5db;
    border-radius: 3px;
    font-size: 11px;
    outline: none;
  }

  tbody tr {
    border-bottom: 1px solid #e2e8f0;
  }

  tbody tr:hover {
    background: #f8fafc;
  }

  tbody tr.selected {
    background: #eff6ff;
  }

  tbody tr.focused td.focused-cell {
    outline: 2px solid #3b82f6;
    outline-offset: -2px;
  }

  tbody tr.editing {
    background: #fefce8;
    outline: 2px solid #eab308;
  }

  tbody tr.error {
    background: #fef2f2;
  }

  tbody td {
    padding: 8px;
  }

  tbody td .cell-edit-input {
    width: 100%;
    padding: 4px 6px;
    border: 1px solid #3b82f6;
    border-radius: 3px;
    font-size: 13px;
    outline: none;
  }

  tbody td .cell-edit-input.invalid {
    border-color: #ef4444;
  }

  .validation-error {
    font-size: 10px;
    color: #ef4444;
    margin-top: 2px;
  }

  .checkbox-cell {
    width: 40px;
    text-align: center;
  }

  .expand-cell {
    width: 30px;
    text-align: center;
    cursor: pointer;
    color: #94a3b8;
  }

  .expand-cell:hover {
    color: #3b82f6;
  }

  .actions-cell {
    width: 60px;
    text-align: center;
  }

  .new-row td {
    padding: 4px 8px;
    background: #f0fdf4;
    opacity: 0.8;
  }

  .new-row input {
    width: 100%;
    padding: 4px 6px;
    border: 1px dashed #86efac;
    border-radius: 3px;
    background: transparent;
    font-size: 12px;
    color: #6b7280;
    outline: none;
  }

  .new-row input:focus {
    border-color: #10b981;
    background: white;
    opacity: 1;
  }

  .detail-row td {
    padding: 8px 8px 8px 70px;
    background: #f8fafc;
    border-bottom: 2px solid #e2e8f0;
  }

  .badge {
    display: inline-block;
    padding: 2px 8px;
    border-radius: 10px;
    font-size: 11px;
    font-weight: 500;
  }

  .pagination {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 12px;
    background: #f8fafc;
    border-top: 1px solid #e2e8f0;
    font-size: 12px;
    color: #64748b;
  }

  .pagination .page-buttons {
    display: flex;
    gap: 4px;
    align-items: center;
  }

  .pagination button {
    padding: 2px 8px;
    border: 1px solid #d1d5db;
    border-radius: 3px;
    background: white;
    font-size: 11px;
    cursor: pointer;
  }

  .pagination button.active {
    background: #3b82f6;
    color: white;
    border-color: #3b82f6;
  }

  .pagination select {
    padding: 2px 4px;
    border: 1px solid #d1d5db;
    border-radius: 3px;
    font-size: 11px;
    margin-left: 8px;
  }

  .loading-overlay {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 40px;
    color: #6b7280;
  }

  .empty-message {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 40px;
    color: #9ca3af;
  }
`;
