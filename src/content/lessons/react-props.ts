import type { Lesson } from '../types';

export const lesson: Lesson = {
  id: 'react-props',
  chapter: 'react',
  title: 'Props 타이핑: PropTypes 졸업하기',
  summary: '컴포넌트의 입력을 타입으로 선언합니다. 잘못된 props는 화면을 띄우기 전에, 컴포넌트를 쓰는 JSX 줄에서 드러납니다.',
  minutes: 12,
  steps: [
    {
      id: 'react-props-1',
      title: 'PropTypes 대신 interface',
      runner: 'react',
      errors: 2,
      body: [
        {
          kind: 'callout',
          tone: 'bridge',
          title: 'PropTypes와 다른 점',
          text: 'PropTypes는 화면을 띄워서 **그 컴포넌트가 실제로 렌더링돼야** 콘솔에 경고가 나옵니다. 잘 안 들어가는 화면의 실수는 배포 뒤에야 발견되죠. 게다가 React 19부터는 그 경고마저 나오지 않습니다. TS는 컴포넌트를 **쓰는 JSX 줄에** 바로 빨간 줄을 긋습니다. 파일 확장자를 `.js`나 `.jsx`에서 `.tsx`로 바꾸는 것이 시작입니다.',
        },
        {
          kind: 'compare',
          js: `function PriceTag({ title, price, qty }) { ... }

PriceTag.propTypes = {
  title: PropTypes.string.isRequired,
  price: PropTypes.number.isRequired,
  qty: PropTypes.number.isRequired,
};`,
          ts: `interface PriceTagProps {
  title: string;
  price: number;
  qty: number;
}

function PriceTag({ title, price, qty }: PriceTagProps) { ... }`,
          caption: '`isRequired`가 기본입니다. 컴포넌트 본문은 그대로이고, 매개변수 뒤에 `: PriceTagProps`만 붙습니다.',
        },
        {
          kind: 'p',
          text: '미리보기의 둘째, 셋째 카드에 `NaN원`이 보입니다. 21행은 숫자 자리에 문자열 `"49,000"`을 넘겼고, 22행은 `qty`를 빠뜨렸습니다. 타입 검사는 정확히 그 **두 줄**을 지목하고 있습니다. 화면을 열어 보지 않아도 알 수 있는 버그입니다.',
        },
      ],
      code: `interface PriceTagProps {
  title: string;
  price: number;
  qty: number;
}

function PriceTag({ title, price, qty }: PriceTagProps) {
  const total = (price * qty).toLocaleString('ko-KR');
  return (
    <div className="card">
      <strong>{title}</strong>
      <div className="muted">{qty}개 · 합계 {total}원</div>
    </div>
  );
}

export default function App() {
  return (
    <div className="stack">
      <PriceTag title="기계식 키보드" price={129000} qty={2} />
      <PriceTag title="무선 마우스" price="49,000" qty={3} />
      <PriceTag title="27인치 모니터" price={359000} />
    </div>
  );
}
`,
      mission: {
        text: '21행과 22행의 props를 고쳐서 `NaN`을 없애세요. 마우스는 `49000`원짜리 3개, 모니터는 1개입니다.',
        goal: { noTypeErrors: true, previewIncludes: ['147,000원', '359,000원'] },
        hint: '숫자는 따옴표가 아니라 중괄호로 넘깁니다. `price={49000}`, 그리고 22행에 `qty={1}`',
        answer: `interface PriceTagProps {
  title: string;
  price: number;
  qty: number;
}

function PriceTag({ title, price, qty }: PriceTagProps) {
  const total = (price * qty).toLocaleString('ko-KR');
  return (
    <div className="card">
      <strong>{title}</strong>
      <div className="muted">{qty}개 · 합계 {total}원</div>
    </div>
  );
}

export default function App() {
  return (
    <div className="stack">
      <PriceTag title="기계식 키보드" price={129000} qty={2} />
      <PriceTag title="무선 마우스" price={49000} qty={3} />
      <PriceTag title="27인치 모니터" price={359000} qty={1} />
    </div>
  );
}
`,
      },
    },
    {
      id: 'react-props-2',
      title: '선택 props와 기본값',
      runner: 'react',
      errors: 1,
      body: [
        {
          kind: 'p',
          text: '22행은 `name`만 넘겼습니다. `size`와 `online`이 필수라서 빨간 줄이 생겼고, 미리보기 둘째 줄에는 동그라미가 사라지고 `undefinedpx`가 찍혔습니다.',
        },
        {
          kind: 'compare',
          js: `Badge.propTypes = {
  label: PropTypes.string.isRequired,
  count: PropTypes.number,
};
Badge.defaultProps = { count: 0 };`,
          ts: `interface BadgeProps {
  label: string;
  count?: number;
}

function Badge({ label, count = 0 }: BadgeProps) { ... }`,
          caption: '안 넘겨도 되는 props에만 `?`를 붙이고, 기본값은 구조 분해에서 줍니다. 함수 컴포넌트의 `defaultProps`는 React 19에서 없어졌습니다.',
        },
        {
          kind: 'callout',
          tone: 'warn',
          title: '?만 붙이면 절반입니다',
          text: '`size?: number`는 "`number` 또는 `undefined`가 들어온다"는 뜻일 뿐입니다. `?`만 붙여 보세요. 빨간 줄은 사라지지만 화면의 `undefinedpx`는 그대로입니다. 값이 없을 때 쓸 기본값까지 줘야 끝납니다.',
        },
      ],
      code: `interface AvatarProps {
  name: string;
  size: number;
  online: boolean;
}

function Avatar({ name, size, online }: AvatarProps) {
  const circle = { width: size, height: size, borderRadius: '50%', background: '#2b68b5' };
  return (
    <div className="row">
      <span style={circle} />
      <strong>{name}</strong>
      <span className="muted">{online ? '접속 중' : '오프라인'} · {size + 'px'}</span>
    </div>
  );
}

export default function App() {
  return (
    <div className="stack">
      <Avatar name="김코딩" size={48} online />
      <Avatar name="박리덕" />
    </div>
  );
}
`,
      mission: {
        text: '22행은 그대로 두고 `Avatar` 쪽을 고치세요. `size`와 `online`을 선택 props로 바꾸고 기본값을 `40`, `false`로 줘서 둘째 줄에 `40px`이 보이게 합니다.',
        goal: { noTypeErrors: true, previewIncludes: ['40px'], codeIncludes: ['<Avatar name="박리덕" />'] },
        hint: '타입에는 `size?: number`, 구조 분해에는 `{ name, size = 40, online = false }`',
        answer: `interface AvatarProps {
  name: string;
  size?: number;
  online?: boolean;
}

function Avatar({ name, size = 40, online = false }: AvatarProps) {
  const circle = { width: size, height: size, borderRadius: '50%', background: '#2b68b5' };
  return (
    <div className="row">
      <span style={circle} />
      <strong>{name}</strong>
      <span className="muted">{online ? '접속 중' : '오프라인'} · {size + 'px'}</span>
    </div>
  );
}

export default function App() {
  return (
    <div className="stack">
      <Avatar name="김코딩" size={48} online />
      <Avatar name="박리덕" />
    </div>
  );
}
`,
      },
    },
    {
      id: 'react-props-3',
      title: '정해진 값만 받기: 유니온 props',
      runner: 'react',
      errors: 2,
      body: [
        {
          kind: 'p',
          text: '`variant`, `size`, `tone`처럼 정해진 값 중 하나만 받는 props가 있습니다. `PropTypes.oneOf([...])`로 적던 것을 TS에서는 **리터럴 유니온**으로 적습니다.',
        },
        {
          kind: 'p',
          text: '32행은 `success`의 오타이고, 33행의 `warning`은 아직 없는 값입니다. 미리보기를 보면 그 두 줄의 배지는 색도 글자도 없이 비어 있습니다. JS에서는 화면을 꼼꼼히 봐야 찾는 버그인데, 여기서는 두 줄 모두 빨간 줄이 그어져 있습니다.',
        },
        {
          kind: 'callout',
          tone: 'tip',
          title: '값을 추가하면 고칠 곳을 알려 줍니다',
          text: '`LABEL`과 `COLOR`는 `Record<Tone, string>`이라 **모든 Tone이 빠짐없이** 있어야 합니다. `Tone`에 값을 하나 추가하면 두 표에 빨간 줄이 생겨 채울 곳을 알려 줍니다. 그리고 JSX에서 `tone="` 까지 입력하고 Ctrl+Space를 누르면 가능한 값이 자동완성됩니다.',
        },
      ],
      code: `type Tone = 'info' | 'success' | 'danger';

const LABEL: Record<Tone, string> = {
  info: '안내',
  success: '완료',
  danger: '오류',
};
const COLOR: Record<Tone, string> = {
  info: '#2b68b5',
  success: '#1b7448',
  danger: '#b0281f',
};

interface NoticeProps {
  tone: Tone;
  text: string;
}

function Notice({ tone, text }: NoticeProps) {
  const badge = { background: COLOR[tone], color: '#fff' };
  return (
    <div className="card">
      <span className="badge" style={badge}>{LABEL[tone]}</span> {text}
    </div>
  );
}

export default function App() {
  return (
    <div className="stack">
      <Notice tone="info" text="새 버전이 준비되었습니다" />
      <Notice tone="sucess" text="결제가 끝났습니다" />
      <Notice tone="warning" text="재고가 3개 남았습니다" />
    </div>
  );
}
`,
      mission: {
        text: '(1) 32행의 오타를 고치고, (2) `Tone`에 `\'warning\'`을 추가하세요. 그러면 `LABEL`(3행)과 `COLOR`(8행)에 새 오류가 생깁니다. 라벨 `주의`와 색 `#b7791f`를 채워 배지 세 개가 모두 보이게 하세요.',
        goal: { noTypeErrors: true, previewIncludes: ['완료', '주의'] },
        hint: "`type Tone = 'info' | 'success' | 'danger' | 'warning';` 그리고 두 표에 각각 `warning: '주의',` 와 `warning: '#b7791f',`",
        answer: `type Tone = 'info' | 'success' | 'danger' | 'warning';

const LABEL: Record<Tone, string> = {
  info: '안내',
  success: '완료',
  danger: '오류',
  warning: '주의',
};
const COLOR: Record<Tone, string> = {
  info: '#2b68b5',
  success: '#1b7448',
  danger: '#b0281f',
  warning: '#b7791f',
};

interface NoticeProps {
  tone: Tone;
  text: string;
}

function Notice({ tone, text }: NoticeProps) {
  const badge = { background: COLOR[tone], color: '#fff' };
  return (
    <div className="card">
      <span className="badge" style={badge}>{LABEL[tone]}</span> {text}
    </div>
  );
}

export default function App() {
  return (
    <div className="stack">
      <Notice tone="info" text="새 버전이 준비되었습니다" />
      <Notice tone="success" text="결제가 끝났습니다" />
      <Notice tone="warning" text="재고가 3개 남았습니다" />
    </div>
  );
}
`,
      },
    },
    {
      id: 'react-props-4',
      title: 'children과 콜백 props',
      runner: 'react',
      errors: 5,
      body: [
        {
          kind: 'p',
          text: '이번에는 화면이 멀쩡하고, 버튼을 누르면 번호도 바뀝니다. 그런데 빨간 줄이 다섯 곳입니다. 원인은 둘뿐입니다. `CardProps`에 `children`이 없고(8, 29행), `ProductRowProps`에 `onSelect`가 없습니다(22, 31, 32행). **Props 타입에 적지 않은 것은 받지 않는 prop**입니다. `children`도 예외가 아닙니다.',
        },
        {
          kind: 'list',
          items: [
            '`children: ReactNode` — JSX, 문자열, 숫자, `null`, 배열까지 렌더링할 수 있는 모든 것 (`PropTypes.node`)',
            '`onSelect: (id: number) => void` — 인자로 `number`를 넘겨주는 콜백',
            '`onClose?: () => void` — 인자 없는 선택 콜백',
          ],
        },
        {
          kind: 'p',
          text: '`PropTypes.func`는 "함수다"까지만 말하지만, TS는 **무엇을 넘겨주는지**까지 약속합니다. 미션을 끝낸 뒤 `ProductRow` 안의 `onSelect(id)`를 `onSelect(name)`으로 바꿔 보세요. 빨간 줄이 생기고, 버튼을 누르면 번호 자리에 `키보드`가 찍힙니다.',
        },
        {
          kind: 'callout',
          tone: 'tip',
          title: 'React.FC는 꼭 써야 하나요?',
          text: '`const Card: React.FC<CardProps> = ...` 형태도 기존 코드에서 자주 보입니다. 지금은 이 예제처럼 **매개변수에 직접 타입을 붙이는 방식**이 기본입니다. 예전 `FC`는 `children`을 자동으로 넣어 줬지만 React 18 타입부터는 `FC`를 써도 직접 선언해야 합니다. 만나도 놀라지 않을 정도만 알면 됩니다.',
        },
      ],
      code: `import { useState } from 'react';
import type { ReactNode } from 'react';

interface CardProps {
  title: string;
}

function Card({ title, children }: CardProps) {
  return (
    <section className="card">
      <h3>{title}</h3>
      {children}
    </section>
  );
}

interface ProductRowProps {
  id: number;
  name: string;
}

function ProductRow({ id, name, onSelect }: ProductRowProps) {
  return <button onClick={() => onSelect(id)}>{name}</button>;
}

export default function App() {
  const [picked, setPicked] = useState(0);
  return (
    <Card title="오늘의 추천">
      <div className="row">
        <ProductRow id={1} name="키보드" onSelect={(id) => setPicked(id)} />
        <ProductRow id={2} name="마우스" onSelect={(id) => setPicked(id)} />
      </div>
      <p className="muted">선택한 상품 번호: {picked}</p>
    </Card>
  );
}
`,
      mission: {
        text: '`CardProps`에 `children`을, `ProductRowProps`에 `onSelect`를 선언해서 오류 다섯 곳을 한 번에 없애세요. JSX는 고치지 않고, `any`도 쓰지 않습니다.',
        goal: { noTypeErrors: true, codeExcludes: ['any'] },
        hint: '`children: ReactNode;` 와 `onSelect: (id: number) => void;` 두 줄이면 됩니다. `ReactNode`는 2행에 이미 import 되어 있습니다.',
        answer: `import { useState } from 'react';
import type { ReactNode } from 'react';

interface CardProps {
  title: string;
  children: ReactNode;
}

function Card({ title, children }: CardProps) {
  return (
    <section className="card">
      <h3>{title}</h3>
      {children}
    </section>
  );
}

interface ProductRowProps {
  id: number;
  name: string;
  onSelect: (id: number) => void;
}

function ProductRow({ id, name, onSelect }: ProductRowProps) {
  return <button onClick={() => onSelect(id)}>{name}</button>;
}

export default function App() {
  const [picked, setPicked] = useState(0);
  return (
    <Card title="오늘의 추천">
      <div className="row">
        <ProductRow id={1} name="키보드" onSelect={(id) => setPicked(id)} />
        <ProductRow id={2} name="마우스" onSelect={(id) => setPicked(id)} />
      </div>
      <p className="muted">선택한 상품 번호: {picked}</p>
    </Card>
  );
}
`,
      },
    },
    {
      id: 'react-props-5',
      title: '기존 태그의 props 물려받기',
      runner: 'react',
      errors: 2,
      body: [
        {
          kind: 'p',
          text: '`<button>`을 감싼 공용 버튼입니다. 20, 21행에서 `className`과 `disabled`를 넘겼는데 `ButtonProps`에 없어서 빨간 줄이 생겼습니다. 미리보기에서도 확인됩니다. `저장`은 파란색이 아니고, `삭제`는 비활성화되지 않았습니다. 컴포넌트가 꺼내 쓰지 않은 props는 **조용히 버려집니다.**',
        },
        {
          kind: 'p',
          text: '`type`, `aria-label`, `onFocus`... 필요할 때마다 하나씩 추가할 수는 없습니다. `ComponentProps<\'button\'>`은 **`<button>` 태그가 받는 props 전부**를 담은 타입입니다. 이걸 `extends`하고, 나머지는 `...rest`로 그대로 넘깁니다.',
        },
        {
          kind: 'code',
          lang: 'tsx',
          title: '같은 패턴: input 감싸기',
          code: `interface TextFieldProps extends ComponentProps<'input'> {
  label: string;
}

function TextField({ label, ...rest }: TextFieldProps) {
  return <label>{label} <input {...rest} /></label>;
}`,
        },
        {
          kind: 'callout',
          tone: 'tip',
          title: 'React Native와 직접 만든 컴포넌트',
          text: 'RN에서는 `ComponentProps<typeof Pressable>`처럼 `typeof 컴포넌트`를 넣거나, RN이 내보내는 `PressableProps`, `TextInputProps`를 씁니다. 직접 만든 컴포넌트의 props도 `ComponentProps<typeof Button>`으로 꺼낼 수 있습니다.',
        },
      ],
      code: `import type { ComponentProps, ReactNode } from 'react';

interface ButtonProps {
  loading?: boolean;
  onClick?: () => void;
  children: ReactNode;
}

function Button({ loading = false, onClick, children }: ButtonProps) {
  return (
    <button onClick={onClick} disabled={loading}>
      {loading ? '처리 중...' : children}
    </button>
  );
}

export default function App() {
  return (
    <div className="row">
      <Button className="primary" onClick={() => console.log('저장')}>저장</Button>
      <Button className="danger" disabled>삭제</Button>
      <Button loading>결제</Button>
    </div>
  );
}
`,
      mission: {
        text: '`ButtonProps`가 `ComponentProps<\'button\'>`을 물려받게 하고, `Button`이 나머지 props를 `...rest`로 받아 `<button>`에 `{...rest}`로 그대로 넘기게 고치세요. 빨간 줄을 없앤 뒤, 미리보기에서 `저장`이 파란색으로, `삭제`가 흐리게(비활성화) 바뀌었는지도 직접 확인하세요.',
        goal: { noTypeErrors: true, codeIncludes: ['ComponentProps<', '{...'] },
        hint: '`interface ButtonProps extends ComponentProps<\'button\'> { loading?: boolean }` 로 줄이고, `{ loading = false, disabled, children, ...rest }`로 받아 `<button disabled={loading || disabled} {...rest}>`',
        answer: `import type { ComponentProps } from 'react';

interface ButtonProps extends ComponentProps<'button'> {
  loading?: boolean;
}

function Button({ loading = false, disabled, children, ...rest }: ButtonProps) {
  return (
    <button disabled={loading || disabled} {...rest}>
      {loading ? '처리 중...' : children}
    </button>
  );
}

export default function App() {
  return (
    <div className="row">
      <Button className="primary" onClick={() => console.log('저장')}>저장</Button>
      <Button className="danger" disabled>삭제</Button>
      <Button loading>결제</Button>
    </div>
  );
}
`,
      },
    },
  ],
  exercise: {
    id: 'ex-react-props',
    title: 'Button의 Props 정의하기',
    prompt: '`ButtonProps`를 완성하세요. `variant`는 `primary` 또는 `ghost`(선택), `disabled`는 불리언(선택), `onPress`는 인자와 반환값이 없는 함수(필수), `children`은 렌더링 가능한 모든 것(필수)입니다. 타입은 실행 전에 지워지므로 미리보기의 버튼은 처음부터 동작합니다. 목표는 빨간 줄 0개입니다.',
    runner: 'react',
    starter: `import type { ReactNode } from 'react';

// TODO: ButtonProps를 완성하세요.
type ButtonProps = {};

function Button({ variant = 'primary', disabled, onPress, children }: ButtonProps) {
  return (
    <button className={variant} disabled={disabled} onClick={onPress}>
      {children}
    </button>
  );
}`,
    tests: `const ok1 = <Button onPress={() => console.log('저장을 눌렀습니다')}>저장</Button>;
const ok2 = (
  <Button variant="ghost" disabled onPress={() => console.log('취소를 눌렀습니다')}>
    <b>취소</b>
  </Button>
);

// @ts-expect-error onPress는 필수입니다
const bad1 = <Button>저장</Button>;
// @ts-expect-error 없는 variant입니다
const bad2 = <Button variant="danger" onPress={() => {}}>삭제</Button>;

export default function Demo() {
  console.log('Demo 렌더링: 저장(primary), 취소(ghost, disabled)');
  return <div className="row">{ok1}{ok2}</div>;
}`,
    solution: `import type { ReactNode } from 'react';

type ButtonProps = {
  variant?: 'primary' | 'ghost';
  disabled?: boolean;
  onPress: () => void;
  children: ReactNode;
};

function Button({ variant = 'primary', disabled, onPress, children }: ButtonProps) {
  return (
    <button className={variant} disabled={disabled} onClick={onPress}>
      {children}
    </button>
  );
}`,
    hints: [
      '선택 props는 이름 뒤에 `?`를 붙입니다.',
      '인자와 반환값이 없는 함수의 타입은 `() => void` 입니다.',
      'children에는 이미 import 되어 있는 `ReactNode`를 쓰세요.',
    ],
  },
  quiz: [
    {
      id: 'q-react-props-1',
      question: '`children`의 타입으로 가장 일반적으로 쓰는 것은?',
      options: ['string', 'JSX.Element', 'ReactNode', 'any'],
      answer: 2,
      explanation: 'ReactNode는 JSX, 문자열, 숫자, null, 배열 등 렌더링 가능한 모든 값을 포함합니다. JSX.Element는 문자열이나 null을 받지 못해 너무 좁습니다.',
    },
    {
      id: 'q-react-props-2',
      question: 'JS에서 `defaultProps`로 주던 기본값을 TS에서는 어떻게 줄까요?',
      options: [
        'interface에 기본값을 적는다',
        '선택 속성(`?`)으로 선언하고 구조 분해에서 기본값을 준다',
        '`as`로 단언한다',
        'TS에서는 기본값을 줄 수 없다',
      ],
      answer: 1,
      explanation: '타입에는 값이 들어갈 수 없습니다. `size?: number`로 선택 사항임을 알리고, `{ size = 40 }`처럼 JS의 기본 매개변수 문법으로 값을 줍니다.',
    },
    {
      id: 'q-react-props-3',
      question: '`variant: \'primary\' | \'ghost\'`로 선언한 버튼에 `<Button variant="primay" />`(오타)를 쓰면?',
      options: [
        '화면을 띄웠을 때 콘솔에 경고가 나온다',
        'JSX 줄에 타입 오류가 생기고, 그대로 실행하면 스타일이 빠진 버튼이 렌더링된다',
        '번들러가 실행을 막는다',
        '가장 비슷한 값인 primary로 자동 교정된다',
      ],
      answer: 1,
      explanation: '타입 검사는 실행 전에 그 줄을 지목하지만, 타입은 빌드할 때 지워지므로 실행 자체를 막지는 않습니다. 그래서 배포 전에 `tsc --noEmit`을 돌려 빨간 줄이 0개인지 확인합니다.',
    },
  ],
};
