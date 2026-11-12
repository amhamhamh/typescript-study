import { cheatsheet } from '../content/cheatsheet';

export function CheatsheetPage() {
  return (
    <article className="lesson cheats">
      <header className="lesson__head">
        <p className="eyebrow">한 장 정리</p>
        <h1>JS → TS 치트시트</h1>
        <p className="lesson__summary">익숙한 코드가 TypeScript에서 무엇으로 바뀌는지 빠르게 찾아보는 표입니다.</p>
      </header>

      {cheatsheet.map((group) => (
        <section key={group.title} className="cheat-group">
          <h2>{group.title}</h2>
          <div className="cheat-table-wrap">
            <table className="cheat-table">
              <thead>
                <tr>
                  <th scope="col">{group.beforeLabel}</th>
                  <th scope="col">TypeScript</th>
                </tr>
              </thead>
              <tbody>
                {group.rows.map((row) => (
                  <tr key={row.before}>
                    <td><code>{row.before}</code></td>
                    <td>
                      <code>{row.after}</code>
                      {row.note && <span className="cheat-note">{row.note}</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}
    </article>
  );
}
