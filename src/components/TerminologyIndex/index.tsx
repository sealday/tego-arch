import type {ReactNode} from 'react';
import terminology from '@site/data/terminology.json';
import styles from './styles.module.css';

type TerminologyTerm = (typeof terminology.terms)[number];

type TerminologyTableProps = {
  terms: readonly TerminologyTerm[];
};

export function TerminologyTable({terms}: TerminologyTableProps): ReactNode {
  const sortedTerms = [...terms].sort(
    (left, right) => left.order - right.order,
  );

  return (
    <div
      className={styles.tableRegion}
      role="region"
      aria-label="规范术语表"
      tabIndex={0}>
      <table>
        <thead>
          <tr>
            <th>规范中文</th>
            <th>首次出现</th>
            <th>后续使用</th>
            <th>使用边界</th>
          </tr>
        </thead>
        <tbody>
          {sortedTerms.map((term) => (
            <tr data-term-id={term.id} key={term.id}>
              <th scope="row">{term.canonical_zh}</th>
              <td>{term.first_use}</td>
              <td>{term.subsequent_use.join('、')}</td>
              <td>{term.note}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function TerminologyIndex(): ReactNode {
  return <TerminologyTable terms={terminology.terms} />;
}
