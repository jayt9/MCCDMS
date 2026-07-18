export default function RosterList({ title, items, renderRow, emptyLabel }) {
  return (
    <div className="roster-list">
      <h4>{title}</h4>
      {items.length === 0 ? (
        <p className="empty">{emptyLabel}</p>
      ) : (
        items.map((item, i) => <div key={item.id ?? i}>{renderRow(item)}</div>)
      )}
    </div>
  );
}
