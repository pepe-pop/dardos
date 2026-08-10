/**
 * QUIZ „10 lat darta" — 10 pytań.
 * Pytania z wiedzą o darcie są prawdziwe; pytania klubowe oznaczone [EDYTUJ] — zamień na własne.
 * Format: { q, options: string[4], correct: index, fun?: krótka ciekawostka po odpowiedzi }
 */
export const QUIZ = [
  {
    q: 'Ile punktów jest warte trafienie w środek tarczy (bullseye)?',
    options: ['25', '50', '75', '100'],
    correct: 1,
    fun: 'Bullseye = 50 punktów. Wewnętrzny środek to 50, zewnętrzny (25) to „single bull".',
  },
  {
    q: 'Ile sektorów ma standardowa tarcza do darta?',
    options: ['18', '20', '22', '24'],
    correct: 1,
    fun: '20 sektorów, od 1 do 20 — w układzie, który ma utrudnić celowanie w sąsiednie liczby.',
  },
  {
    q: 'Ile punktów daje potrójna 20 (triple 20)?',
    options: ['40', '50', '60', '80'],
    correct: 2,
    fun: '3 × 20 = 60. Maksymalny wynik pojedynczego rzutu na tarczy.',
  },
  {
    q: 'Z jakiej odległości rzuca się w darta?',
    options: ['2,13 m', '2,37 m', '2,75 m', '3,05 m'],
    correct: 1,
    fun: 'Linia rzutu (oche) jest 2,37 m od tarczy, środek tarczy na wysokości 1,73 m.',
  },
  {
    q: 'Klasyczny mecz 501 kończy się...',
    options: ['trafieniem w bull', 'podwójną (double) dowolnej liczby', 'trzykrotną 20', 'remisem'],
    correct: 1,
    fun: 'W 501 musisz zejść do zera trafieniem w pole podwójne (albo bull).',
  },
  {
    q: 'Jak nazywa się linia, z której oddaje się rzuty?',
    options: ['Oche', 'Bull line', 'Throw line', 'Crease'],
    correct: 0,
    fun: '„Oche" (och-ee) — najczęściej z angielskiego „oche" / „oche line".',
  },
  {
    q: 'W którym roku powstał nasz klub? [EDYTUJ]',
    options: ['2013', '2015', '2017', '2019'],
    correct: 1,
    fun: 'Poprawne są dwa podejścia: data w danych TIMELINE i odpowiedź tutaj muszą się zgadzać.',
  },
  {
    q: 'Jak nazywa się nasz pierwszy puchar? [EDYTUJ]',
    options: ['„Złota Lotka"', '„Puchar Ligi"', '„Trofeum Kapitana"', '„Puchar Prezesa"'],
    correct: 0,
    fun: 'Uzupełnij nazwę według rzeczywistej historii klubu.',
  },
  {
    q: 'Gdzie wisi nasza pierwsza tarcza? [EDYTUJ]',
    options: ['W klubokawiarni', 'W garażu u Marka', 'Na ścianie sali treningowej', 'W muzeum'],
    correct: 2,
    fun: 'Zmień odpowiedzi tak, by pasowały do prawdziwej historii.',
  },
  {
    q: 'Co jest najważniejsze w naszym klubie? [EDYTUJ]',
    options: ['Wygrywanie za wszelką cenę', 'Dobra zabawa i ludzie', 'Nowy sprzęt', 'Rekordy'],
    correct: 1,
    fun: 'Bo po 10 latach wiemy, że to ludzie tworzą klub. 🎯',
  },
]

/** Memory — pary symboli (emoji). Możesz podmienić na zdjęcia członków. */
export const MEMORY_SYMBOLS = ['🎯', '🏆', '🥇', '🍻', '🃏', '🍕']

/** Bingo klubowe — pula haseł (karta losuje 24 z nich + środek FREE). */
export const BINGO_POOL = [
  'Pierwszy bullseye dzisiaj',
  'Ktoś zgubił lotkę',
  'Rozmowa o ligowym meczu',
  'Double out z 32',
  'Nowa tarcza w klubie',
  'Trening w poniedziałek',
  'Ktoś wspomina 2015 rok',
  '„Jeszcze jedna runda!"',
  'Małe piwo po meczu',
  'Stary gracz wraca po latach',
  'Rzut ze sceny 🎤',
  'Ktoś próbuje rzutu za plecami',
  'Turniej o „Złotą Lotkę"',
  'Historia o wygranym finale',
  'Ktoś liczy 180 punktów',
  'Wspomnienie pierwszego treningu',
  'Nowy członek klubu',
  'Ktoś gubi punktację',
  'Zdjęcie z pucharem',
  'Ktoś mówi „oche" poprawnie',
  'Burza mózgów nad taktyką',
  'Ktoś strzela z zamkniętymi oczami',
  'Anegdota z wyjazdu',
  'Propozycja toastu za 10 lat',
]
