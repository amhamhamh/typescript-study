import type { Lesson } from '../types';

export const lesson: Lesson = {
  id: 'react-events',
  chapter: 'react',
  title: '이벤트와 폼: e의 타입은 무엇인가',
  summary: '핸들러의 e에 빨간 줄이 생기는 이유와, 이벤트 타입을 외우지 않고 찾아 붙이는 방법.',
  minutes: 14,
  steps: [
    {
      id: 'react-events-1',
      title: '첫 번째 벽: 밖으로 뺀 핸들러의 e',
      runner: 'react',
      errors: 1,
      body: [
        {
          kind: 'callout',
          tone: 'bridge',
          title: 'JS에서는 아무 문제 없던 한 줄',
          text: '`const handleChange = (e) => { ... }`. 컴포넌트마다 써 온 이 줄이 TS로 옮기면 가장 먼저 빨개집니다. 6행의 `Parameter \'e\' implicitly has an \'any\' type`입니다. 함수 매개변수는 추론할 근거가 없어서 직접 적어야 한다는, 첫 레슨의 그 오류입니다.',
        },
        {
          kind: 'p',
          text: '오류는 6행 한 곳뿐입니다. 그런데 미리보기의 입력창에 글자를 하나 쳐 보세요. 콘솔에 `입력값: undefined`가 찍히고(React의 경고도 따라옵니다) 인사말에서 이름이 사라집니다. 7~8행의 `vaule` 오타 때문입니다. `e`가 `any`라서 타입 검사는 이 오타를 보지 못합니다.',
        },
        {
          kind: 'p',
          text: '가장 쉬운 해결책은 함수를 **JSX 안에 직접** 쓰는 것입니다. `onChange` 자리에 놓인 함수는 "input의 onChange에 들어갈 함수"라는 문맥이 있어서 TS가 `e`의 타입을 추론합니다. 옮긴 뒤 `e` 위에 마우스를 올리면 추론된 타입이 보입니다.',
        },
        {
          kind: 'code',
          lang: 'tsx',
          title: '인라인 핸들러는 타입을 적지 않아도 됩니다',
          code: `<input
  value={name}
  onChange={(e) => setName(e.target.value)}
/>`,
        },
      ],
      code: `import { useState } from 'react';

export default function NameForm() {
  const [name, setName] = useState('김코딩');

  const handleChange = (e) => {
    console.log('입력값:', e.target.vaule);
    setName(e.target.vaule);
  };

  return (
    <div className="stack">
      <input value={name} onChange={handleChange} />
      <p>안녕하세요, {name}님</p>
    </div>
  );
}
`,
      mission: {
        text: '`handleChange`의 내용을 13행의 `onChange` 안으로 옮기고 6~9행을 지우세요. 옮기는 순간 `vaule` 두 곳에 빨간 줄이 생깁니다. `value`로 고치고, 입력창에 글자를 쳐서 인사말이 따라 바뀌는지 확인하세요.',
        goal: { noTypeErrors: true },
        hint: '`onChange={(e) => { console.log(\'입력값:\', e.target.value); setName(e.target.value); }}`',
        answer: `import { useState } from 'react';

export default function NameForm() {
  const [name, setName] = useState('김코딩');

  return (
    <div className="stack">
      <input
        value={name}
        onChange={(e) => {
          console.log('입력값:', e.target.value);
          setName(e.target.value);
        }}
      />
      <p>안녕하세요, {name}님</p>
    </div>
  );
}
`,
      },
    },
    {
      id: 'react-events-2',
      title: '핸들러를 따로 둘 때: 이벤트종류<요소>',
      runner: 'react',
      errors: 1,
      body: [
        {
          kind: 'p',
          text: '핸들러가 길거나 여러 곳에서 쓰이면 밖에 두고 싶습니다. 그때는 `e`의 타입을 직접 적습니다. 모양은 항상 **`이벤트종류<핸들러를 붙인 요소>`**이고, 타입은 `react`에서 가져옵니다(2행).',
        },
        {
          kind: 'code',
          lang: 'tsx',
          code: `const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
  e.target.value; // string
};`,
        },
        {
          kind: 'callout',
          tone: 'tip',
          title: '타입 이름은 외우지 않습니다',
          text: '앞 단계처럼 JSX에 `onChange={(e) => {}}`를 쓰고 `e` 위에 마우스를 올리면 `ChangeEvent<HTMLInputElement, HTMLInputElement>`가 보입니다. 그 이름을 가져다 쓰면 됩니다. 꺾쇠 안의 두 번째 항목은 생략해도 됩니다. 아직 import 하지 않은 타입은 `React.KeyboardEvent<...>`처럼 앞에 `React.`이 붙어 보이는데, 같은 타입입니다.',
        },
        {
          kind: 'p',
          text: '미리보기에서 나이를 `31`로 바꿔 보세요. 내년 나이가 `32`가 아니라 **`311`**이 됩니다. input의 값은 `type="number"`여도 항상 문자열이기 때문입니다. 지금은 `e`가 `any`라 조용하지만, 타입을 붙이면 9행이 바로 이 버그로 지목됩니다.',
        },
      ],
      code: `import { useState } from 'react';
import type { ChangeEvent } from 'react';

export default function AgeForm() {
  const [age, setAge] = useState(30);

  const handleChange = (e) => {
    console.log('입력값:', e.target.value, typeof e.target.value);
    setAge(e.target.value);
  };

  return (
    <div className="stack">
      <input type="number" value={age} onChange={handleChange} />
      <p>내년 나이: {age + 1}</p>
    </div>
  );
}
`,
      mission: {
        text: '7행의 `e`에 `ChangeEvent<HTMLInputElement>` 타입을 붙이세요. 9행에 "string은 number 자리에 넣을 수 없다"는 새 오류가 나타납니다. 숫자로 바꿔 넣도록 고친 뒤, 나이를 바꿔도 내년 나이가 올바른지 확인하세요.',
        goal: { noTypeErrors: true },
        hint: '`(e: ChangeEvent<HTMLInputElement>) =>` 그리고 9행은 `setAge(Number(e.target.value))`',
        answer: `import { useState } from 'react';
import type { ChangeEvent } from 'react';

export default function AgeForm() {
  const [age, setAge] = useState(30);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    console.log('입력값:', e.target.value, typeof e.target.value);
    setAge(Number(e.target.value));
  };

  return (
    <div className="stack">
      <input type="number" value={age} onChange={handleChange} />
      <p>내년 나이: {age + 1}</p>
    </div>
  );
}
`,
      },
    },
    {
      id: 'react-events-3',
      title: '요소와 이벤트 종류만 바꾸면 됩니다',
      runner: 'react',
      errors: 3,
      body: [
        {
          kind: 'p',
          text: '나머지 이벤트도 같은 모양입니다. 앞의 이벤트 종류와 꺾쇠 안의 요소만 바뀝니다.',
        },
        {
          kind: 'list',
          items: [
            '`<input>` onChange → `ChangeEvent<HTMLInputElement>`',
            '`<select>` onChange → `ChangeEvent<HTMLSelectElement>`',
            'onKeyDown → `KeyboardEvent<HTMLInputElement>`',
            'onClick → `MouseEvent<HTMLButtonElement>`',
            '`<form>` onSubmit → `SubmitEvent<HTMLFormElement>` (React 18 이하 프로젝트에서는 `FormEvent<HTMLFormElement>`)',
          ],
        },
        {
          kind: 'p',
          text: '미리보기의 검색창을 누르고 Esc를 눌러 보세요. 검색어가 지워져야 하는데 아무 일도 없습니다. 13행이 예전 `keyCode` 습관대로 숫자 `27`과 비교하고 있어서입니다. `e`에 타입이 붙으면 TS가 "문자열과 숫자는 같을 수 없다"며 그 줄을 지목합니다.',
        },
        {
          kind: 'callout',
          tone: 'warn',
          title: 'import를 빠뜨리면 다른 타입이 잡힙니다',
          text: '`KeyboardEvent`, `MouseEvent`, `SubmitEvent`는 브라우저(DOM)에도 같은 이름의 전역 타입이 있습니다. `react`에서 import 하지 않고 쓰면 그쪽이 잡혀서 `Type \'KeyboardEvent\' is not generic` 같은 엉뚱한 오류가 납니다. 이 메시지를 만나면 2행의 import부터 확인하세요.',
        },
      ],
      code: `import { useState } from 'react';
import type { ChangeEvent } from 'react';

export default function SearchForm() {
  const [category, setCategory] = useState('all');
  const [keyword, setKeyword] = useState('키보드');

  const handleSelect = (e) => {
    setCategory(e.target.value);
  };

  const handleKeyDown = (e) => {
    if (e.key === 27) setKeyword('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('검색:', category, keyword);
  };

  return (
    <form className="row" onSubmit={handleSubmit}>
      <select value={category} onChange={handleSelect}>
        <option value="all">전체</option>
        <option value="sale">할인 중</option>
      </select>
      <input
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
        onKeyDown={handleKeyDown}
      />
      <button className="primary">검색</button>
    </form>
  );
}
`,
      mission: {
        text: '2행의 import에 `KeyboardEvent`, `SubmitEvent`를 추가하고 세 핸들러의 `e`에 알맞은 타입을 붙이세요. 그러면 13행에 새 오류가 나타납니다. `\'Escape\'`와 비교하도록 고친 뒤 Esc로 검색어가 지워지는지 확인하세요.',
        goal: { noTypeErrors: true },
        hint: '차례로 `ChangeEvent<HTMLSelectElement>`, `KeyboardEvent<HTMLInputElement>`, `SubmitEvent<HTMLFormElement>`. 13행은 `e.key === \'Escape\'`',
        answer: `import { useState } from 'react';
import type { ChangeEvent, KeyboardEvent, SubmitEvent } from 'react';

export default function SearchForm() {
  const [category, setCategory] = useState('all');
  const [keyword, setKeyword] = useState('키보드');

  const handleSelect = (e: ChangeEvent<HTMLSelectElement>) => {
    setCategory(e.target.value);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') setKeyword('');
  };

  const handleSubmit = (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log('검색:', category, keyword);
  };

  return (
    <form className="row" onSubmit={handleSubmit}>
      <select value={category} onChange={handleSelect}>
        <option value="all">전체</option>
        <option value="sale">할인 중</option>
      </select>
      <input
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
        onKeyDown={handleKeyDown}
      />
      <button className="primary">검색</button>
    </form>
  );
}
`,
      },
    },
    {
      id: 'react-events-4',
      title: 'e.target과 e.currentTarget',
      runner: 'react',
      errors: 1,
      body: [
        {
          kind: 'p',
          text: '버튼의 `value`에 상품 id를 넣어 두고 클릭 핸들러에서 꺼내는 코드입니다. 미리보기에서 버튼의 **굵은 상품명**을 눌러 보고, 그 옆의 **"담기" 글자**도 눌러 보세요. 상품명을 누르면 `담은 상품: undefined`가 찍힙니다.',
        },
        {
          kind: 'list',
          items: [
            '`e.target` → 실제로 클릭된 요소. 버튼 안의 `<strong>`일 수도 있습니다. 그래서 타입이 `EventTarget`뿐이고 `value`가 없습니다.',
            '`e.currentTarget` → 핸들러를 **붙인** 요소. 항상 `<button>`이고, 타입은 꺾쇠 안에 적은 `HTMLButtonElement`입니다.',
          ],
        },
        {
          kind: 'p',
          text: '11행의 `Property \'value\' does not exist on type \'EventTarget\'`은 까다로운 규칙이 아닙니다. "누르는 위치에 따라 `undefined`가 나온다"는, 재현하기 어려운 버그를 그대로 예고한 것입니다.',
        },
        {
          kind: 'callout',
          tone: 'tip',
          title: 'onChange의 e.target.value는 왜 됐을까요',
          text: 'change 이벤트는 값이 바뀐 `<input>`, `<select>` 자신에게서 일어나므로 `target`이 곧 그 요소입니다. 그래서 React 타입은 `ChangeEvent`에서는 `target`도 꺾쇠 안의 요소로 잡아 줍니다. 클릭·키보드 이벤트에서는 `currentTarget`을 쓰세요.',
        },
      ],
      code: `import type { MouseEvent } from 'react';

const products = [
  { id: 'p1', title: '기계식 키보드' },
  { id: 'p2', title: '무선 마우스' },
];

export default function ProductList() {
  const handleAdd = (e: MouseEvent<HTMLButtonElement>) => {
    console.log('target:', e.target, '/ currentTarget:', e.currentTarget);
    console.log('담은 상품:', e.target.value);
  };

  return (
    <div className="stack">
      {products.map((p) => (
        <button key={p.id} value={p.id} onClick={handleAdd}>
          <strong>{p.title}</strong> 담기
        </button>
      ))}
    </div>
  );
}
`,
      mission: {
        text: '11행을 고쳐서 버튼의 어디를 눌러도 상품 id(`p1`, `p2`)가 찍히게 하세요.',
        goal: { noTypeErrors: true },
        hint: '`e.target` 대신 `e.currentTarget.value`',
        answer: `import type { MouseEvent } from 'react';

const products = [
  { id: 'p1', title: '기계식 키보드' },
  { id: 'p2', title: '무선 마우스' },
];

export default function ProductList() {
  const handleAdd = (e: MouseEvent<HTMLButtonElement>) => {
    console.log('target:', e.target, '/ currentTarget:', e.currentTarget);
    console.log('담은 상품:', e.currentTarget.value);
  };

  return (
    <div className="stack">
      {products.map((p) => (
        <button key={p.id} value={p.id} onClick={handleAdd}>
          <strong>{p.title}</strong> 담기
        </button>
      ))}
    </div>
  );
}
`,
      },
    },
    {
      id: 'react-events-5',
      title: '폼 전체를 객체 하나로: keyof로 묶은 핸들러',
      runner: 'react',
      errors: 2,
      body: [
        {
          kind: 'p',
          text: '필드가 많은 폼은 state를 객체 하나로 두고 핸들러 하나로 처리해 왔을 겁니다. JS에서 흔히 쓰던 `[e.target.name]: e.target.value`는 `name` 속성에 오타가 나도, 숫자 필드에 문자열이 들어가도 알려 주지 않았습니다. TS로 옮겨도 `e.target.name`은 그냥 `string`이라 마찬가지입니다.',
        },
        {
          kind: 'code',
          lang: 'ts',
          title: '키와, 그 키에 맞는 값을 함께 받기',
          code: `const update = <K extends keyof Form>(key: K, value: Form[K]) => { ... };

update('name', '김코딩'); // key가 'name'이면 value는 string
update('age', 31);        // key가 'age'면 value는 number`,
        },
        {
          kind: 'p',
          text: '제네릭 레슨의 `K extends keyof T`와 `T[K]`입니다. 19행과 20행에 오류가 있습니다. 미리보기에서 가운데 빈 칸(이메일)과 나이 칸에 입력해 보고 아래 JSON을 보세요. 이메일은 `emial`이라는 엉뚱한 키로 들어가서 **입력이 아예 안 되고**, 나이는 따옴표가 붙은 **문자열**이 됩니다.',
        },
        {
          kind: 'callout',
          tone: 'bridge',
          title: 'React Native에서는 더 단순합니다',
          text: '`TextInput`의 `onChangeText`는 이벤트 객체가 아니라 **문자열을 바로** 줍니다. `onChangeText={(text) => update(\'name\', text)}`처럼 같은 `update`를 그대로 쓰면 됩니다. `onPress`도 대부분 `() => void`로 충분합니다. 스크롤 위치처럼 이벤트 객체가 필요할 때만 `NativeSyntheticEvent<NativeScrollEvent>` 같은 타입을 적습니다.',
        },
      ],
      code: `import { useState } from 'react';

interface Form {
  name: string;
  email: string;
  age: number;
}

export default function ProfileForm() {
  const [form, setForm] = useState<Form>({ name: '김코딩', email: '', age: 30 });

  const update = <K extends keyof Form>(key: K, value: Form[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="stack">
      <input value={form.name} onChange={(e) => update('name', e.target.value)} />
      <input value={form.email} onChange={(e) => update('emial', e.target.value)} />
      <input type="number" value={form.age} onChange={(e) => update('age', e.target.value)} />
      <code>{JSON.stringify(form)}</code>
    </div>
  );
}
`,
      mission: {
        text: '(1) 19행의 키 오타와 20행의 값 타입을 고치세요. (2) `Form`에 `agree: boolean`을 추가하고(초기값 `false`), `update(\'agree\', e.target.checked)`로 연결한 체크박스를 넣어 보세요. 미리보기의 JSON에 `"agree":false`가 보이면 성공입니다.',
        goal: { noTypeErrors: true, previewIncludes: ['"agree":false'] },
        hint: '20행은 `update(\'age\', Number(e.target.value))`. 체크박스는 `<input type="checkbox" checked={form.agree} onChange={(e) => update(\'agree\', e.target.checked)} />`',
        answer: `import { useState } from 'react';

interface Form {
  name: string;
  email: string;
  age: number;
  agree: boolean;
}

export default function ProfileForm() {
  const [form, setForm] = useState<Form>({ name: '김코딩', email: '', age: 30, agree: false });

  const update = <K extends keyof Form>(key: K, value: Form[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="stack">
      <input value={form.name} onChange={(e) => update('name', e.target.value)} />
      <input value={form.email} onChange={(e) => update('email', e.target.value)} />
      <input type="number" value={form.age} onChange={(e) => update('age', Number(e.target.value))} />
      <label>
        <input type="checkbox" checked={form.agree} onChange={(e) => update('agree', e.target.checked)} />
        약관에 동의합니다
      </label>
      <code>{JSON.stringify(form)}</code>
    </div>
  );
}
`,
      },
    },
  ],
  exercise: {
    id: 'ex-react-events',
    title: '검색창 핸들러 타이핑',
    prompt: '따로 빼 둔 두 핸들러의 `e`에 타입이 없습니다. 알맞은 이벤트 타입을 `react`에서 import 해서 붙여 보세요. 고친 뒤 미리보기에서 검색어를 입력하고 Enter를 누르면 콘솔에 결과가 찍힙니다.',
    runner: 'react',
    starter: `import { useState } from 'react';

interface SearchBoxProps {
  onSearch: (keyword: string) => void;
}

function SearchBox({ onSearch }: SearchBoxProps) {
  const [keyword, setKeyword] = useState('');

  const handleChange = (e) => {
    setKeyword(e.target.value);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') onSearch(keyword.trim());
  };

  return (
    <input
      value={keyword}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      placeholder="검색어 입력 후 Enter"
    />
  );
}`,
    tests: `export default function Demo() {
  return (
    <div className="stack">
      <SearchBox onSearch={(keyword) => console.log('검색:', keyword, '(' + keyword.length + '글자)')} />
      <p className="muted">검색어를 입력하고 Enter를 누르면 콘솔에 찍힙니다.</p>
    </div>
  );
}

// @ts-expect-error onSearch는 꼭 넘겨야 합니다
const missing = <SearchBox />;`,
    solution: `import { useState } from 'react';
import type { ChangeEvent, KeyboardEvent } from 'react';

interface SearchBoxProps {
  onSearch: (keyword: string) => void;
}

function SearchBox({ onSearch }: SearchBoxProps) {
  const [keyword, setKeyword] = useState('');

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setKeyword(e.target.value);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') onSearch(keyword.trim());
  };

  return (
    <input
      value={keyword}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      placeholder="검색어 입력 후 Enter"
    />
  );
}`,
    hints: [
      '`import type { ChangeEvent, KeyboardEvent } from \'react\';` 를 추가하세요. import를 빠뜨리면 DOM의 전역 `KeyboardEvent`가 잡혀 `Type \'KeyboardEvent\' is not generic` 오류가 납니다.',
      'onChange 핸들러는 `(e: ChangeEvent<HTMLInputElement>)` 입니다.',
      'onKeyDown 핸들러는 `(e: KeyboardEvent<HTMLInputElement>)` 입니다.',
    ],
  },
  quiz: [
    {
      id: 'q-react-events-1',
      question: '`<select onChange={handleChange}>`의 핸들러 매개변수 타입은?',
      options: [
        'ChangeEvent<HTMLInputElement>',
        'ChangeEvent<HTMLSelectElement>',
        'SelectEvent',
        'MouseEvent<HTMLSelectElement>',
      ],
      answer: 1,
      explanation: '꺾쇠 안에는 핸들러를 붙인 요소의 타입이 들어갑니다. select 요소는 HTMLSelectElement입니다.',
    },
    {
      id: 'q-react-events-2',
      question: '이벤트 타입 이름이 기억나지 않을 때 가장 빠른 방법은?',
      options: [
        '`e: any`로 적는다',
        '핸들러를 JSX에 인라인으로 쓰고 e 위에 마우스를 올려 추론된 타입을 확인한다',
        '`// @ts-ignore`를 붙인다',
        '이벤트를 쓰지 않는다',
      ],
      answer: 1,
      explanation: 'JSX 속성에 직접 쓴 함수는 TS가 문맥에서 매개변수 타입을 추론합니다. 그 타입을 그대로 가져다 쓰면 됩니다.',
    },
    {
      id: 'q-react-events-3',
      question: '`<button value="p1" onClick={handleAdd}><strong>키보드</strong> 담기</button>`에서 `e.target.value`가 타입 오류인 이유는?',
      options: [
        'button에는 value 속성이 없어서',
        'MouseEvent에는 target이 없어서',
        '실제로 클릭된 요소가 버튼 안의 strong일 수도 있어서 target의 타입을 버튼으로 단정할 수 없기 때문에',
        'onClick 핸들러에서는 e를 쓸 수 없어서',
      ],
      answer: 2,
      explanation: 'target은 이벤트가 실제로 발생한 요소(자식일 수 있음), currentTarget은 핸들러를 붙인 요소입니다. 버튼의 value가 필요하면 `e.currentTarget.value`를 씁니다.',
    },
  ],
};
