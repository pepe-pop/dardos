/**
 * QUIZ „10 lat darta" — 10 pytań.
 * Pytania z wiedzą o darcie są prawdziwe; pytania klubowe oznaczone [EDYTUJ] — zamień na własne.
 * Format: { q, options: string[4], correct: index, fun?: krótka ciekawostka po odpowiedzi }
 */
export const QUIZ = [
  {
    q: "Kto został mistrzem Turnieju o Puchar Prezesa Pekaes Zamość 2020?",
    options: ["Kacper Łaszkiewicz", "Kacper Moczarski", "Kuba Sak", "Jakub Wujec"],
    correct: 0,
    fun: "Kacper Łaszkiewicz przed turniejem w 2020 roku przez pół roku zbierał szlify na zagranicznych obiektach.",
  },
  {
    q: "Z kim w finale Turnieju o Puchar Prezesa 2020 zmierzył się zwycięzca Kacper Łaszkiewicz?",
    options: ["Z Wiktorem Nurzyńskim", "Z Miłoszem Ziemińskim", "Z Kubą Wujcem", "Z Karolem Tytoniem"],
    correct: 2,
    fun: "Kuba Wujec w trakcie tamtego turnieju popisał się rzuceniem prestiżowego MAX-a (180 punktów).",
  },
  {
    q: "Który zawodnik zajął 3. miejsce w Turnieju o Puchar Prezesa Pekaes Zamość 2020?",
    options: ["Miłosz Ziemiński", "Przemek Poprawa", "Jakub Gmyz", "Krystian Szpatuśko"],
    correct: 0,
    fun: "Miłosz Ziemiński został w relacji nazwany jednym z „ojców założycieli” zamojskiego darta i był niepokonany aż do półfinału.",
  },
  {
    q: "Jakie miejsce w Turnieju o Puchar Prezesa 2020 zajął Prezes – Kuba Sak?",
    options: ["2. miejsce", "4. miejsce", "6. miejsce", "8. miejsce"],
    correct: 1,
    fun: "Prezes otarł się o podium, kończąc zmagania na 4. pozycji tuż przed faworyzowanym Kacprem Moczarskim.",
  },
  {
    q: "Kto otrzymał nagrodę specjalną dla zawodnika turnieju za zajęcie 7. miejsca w Pucharze Prezesa 2020?",
    options: ["Jakub Witkowski", "Kacper Caban", "Przemek Poprawa", "Karol Tytoń"],
    correct: 2,
    fun: "Przemek Poprawa dołączył do świata darta niedługo przed turniejem i bez kompleksów wszedł do fazy pucharowej.",
  },
  {
    q: "O którym zawodniku pisano w 2020 roku, że mógłby ugrać lega z Krzyśkiem Ratajskim, ale i przegrać do zera z własną mamą?",
    options: ["Jakub Gmyz (Gnyx)", "Krystian Szpatuśko", "Wiktor Nurzyński", "Kacper Caban"],
    correct: 0,
    fun: "Jakub Gmyz zajął wówczas 8. miejsce i zyskał miano „człowieka zagadki”.",
  },
  {
    q: "Czym szczególnym na turnieju w 2020 roku wsławił się Kacper Caban?",
    options: ["Rzucił 9. lotkę", "Wygrał seta do zera", "Wygrał lega z mistrzem turnieju", "Dotarł do finału"],
    correct: 2,
    fun: "Kacper Caban zajął 11. miejsce, ale opowiadał o wygranym legu z mistrzem przez kolejny tydzień.",
  },
  {
    q: "Która firma NIE była wymieniona jako sponsor Turnieju o Puchar Prezesa Pekaes Zamość 2020?",
    options: ["Kari&MiłoBud", "WujaMeb", "WitkoWiert", "DartMaster Pro"],
    correct: 3,
    fun: "Wśród lokalnych sponsorów znalazły się firmy: Kari&MiłoBud, WujaMeb, WitkoWiert oraz twórca statuetek KrychaAward.",
  },
  {
    q: "Kto wygrał IV edycję Darterskiego Świątecznego Turnieju, pokonując w finale Jakuba Wujca?",
    options: ["Kacper Łaszkiewicz", "Kacper Moczarski", "Wiktor Nurzyński", "Miłosz Ziemiński"],
    correct: 1,
    fun: "W turnieju wzięło udział dwunastu zawodników, a podium uzupełnił Kacper Łaszkiewicz po wygranej z Wiktorem Nurzyńskim.",
  },
  {
    q: "Co zakłóciło przebieg IV edycji Darterskiego Świątecznego Turnieju?",
    options: ["Awaria tarczy darterskiej", "Wizyta trzech nieproszonych gości", "Brak prądu w lokalu", "Ulewny deszcz"],
    correct: 1,
    fun: "Obecność nieproszonych gości zaskoczyła niemal wszystkich, oprócz słynnej „sześćdziesiony z 2 piętra”.",
  },
  {
    q: "Kiedy odbył się charytatywny turniej piłkarski „Gramy dla Weroniki” z udziałem ekipy Pekaes Zamość?",
    options: ["24 grudnia", "26 grudnia", "31 grudnia", "1 stycznia"],
    correct: 1,
    fun: "Mecz odbył się dzień po turnieju darterskim, co oznaczało dla graczy wyjątkowo trudne „ciężary” kondycyjne.",
  },
  {
    q: "Jaki był główny cel sportowy ekipy Pekaes Zamość na turnieju charytatywnym w piłkę nożną?",
    options: ["Zdobycie pucharu", "Wygranie jednego meczu i powrót do domu", "Brak straconych bramek", "Awans do finału"],
    correct: 1,
    fun: "Plan został w 100% zrealizowany – drużyna wygrała dokładnie jedno spotkanie.",
  },
  {
    q: "Kto podczas piłkarskiego turnieju charytatywnego łączył rolę zawodnika z funkcją trenera?",
    options: ["Kuba Sak", "Jakub Witkowski", "Kacper Moczarski", "Miłosz Ziemiński"],
    correct: 1,
    fun: "W relacji żartobliwie oznaczono profil PZPN z pytaniem o ocenę jego trenerskich dokonań.",
  },
  {
    q: "Który butik był partnerem strategicznym Pekaes Zamość podczas piłkarskiego turnieju?",
    options: ["AMICI BOUTIQUE ZAMOŚĆ", "Zamość Moda Sport", "Elegancja Dart Club", "Prezes Style Zamość"],
    correct: 0,
    fun: "W relacji podziękowano butikowi słowami: „może wyników nie dowozimy, ale fajne z Nas chłopaki”.",
  },
  {
    q: "Jaką piosenkę śpiewano do białego rana przy ognisku podczas turnieju Ranczo Debry?",
    options: ["„Mniej niż zero”", "„Jolka, Jolka pamiętasz”", "„Przez twe oczy zielone”", "„We Are the Champions”"],
    correct: 1,
    fun: "W turnieju par Ranczo Debry rywalizowało aż 35 duetów.",
  },
  {
    q: "Które miejsce w turnieju par Ranczo Debry zajęła para Kuba Sak / Miłosz Ziemiński?",
    options: ["1. miejsce", "3. miejsce", "5. miejsce", "9. miejsce"],
    correct: 2,
    fun: "Kuba Sak i Miłosz Ziemiński okazali się najlepszą parą z reprezentacji Pekaes, zajmując 5. lokatę.",
  },
  {
    q: "Kto zwyciężył w finale Turnieju Świątecznego PeKaeS 2024?",
    options: ["Moczar", "Miłek", "Kapsonik", "Wiki"],
    correct: 0,
    fun: "Moczar (Kacper Moczarski) pokonał w wielkim finale Miłka wynikiem 2:0.",
  },
  {
    q: "Kto zajął 3. miejsce w turnieju PeKaeS 2024 po wygranej z Wikim 3:1?",
    options: ["Kuba Sak", "Kapsonik", "Gnyx", "Poprawa"],
    correct: 1,
    fun: "W półfinałach Moczar wygrał z Wikim 4:2, a Miłek pokonał Kapsonika również 4:2.",
  },
  {
    q: "Kto wygrał świąteczny turniej darta Pekaes Zamość rozegrany 27 grudnia 2025 roku?",
    options: ["Kuba Sak", "Kacper Łaszkiewicz", "Wiktor Nurzyński", "Kacper Moczarski"],
    correct: 0,
    fun: "Kuba Sak stanął na najwyższym stopniu podium, wyprzedzając Kacpra Łaszkiewicza i Wiktora Nurzyńskiego.",
  },
  {
    q: "Które miejsce w świątecznym turnieju z 27.12.2025 roku zajął Przemysław Poprawa?",
    options: ["3. miejsce", "4. miejsce", "5. miejsce", "7. miejsce"],
    correct: 2,
    fun: "Przemek zajął 5. lokatę, wyprzedzając m.in. Jakuba Gmyza i Jakuba Witkowskiego.",
  },
  {
    q: "Ile punktów zdobywa się za pojedyncze trafienie w środek tarczy (tzw. Bullseye / Double Bull)?",
    options: ["25", "50", "75", "100"],
    correct: 1,
    fun: "Zewnętrzny zielony pierścień (Single Bull) daje 25 punktów, natomiast wewnętrzny czerwony środek (Bullseye) to 50 punktów i liczy się jako podwójne pole (Double).",
  },
  {
    q: "Jaka jest maksymalna liczba punktów, jaką gracz może zdobyć trzema lotkami w jednej kolejce w standardowej grze?",
    options: ["150", "160", "170", "180"],
    correct: 3,
    fun: "Maksymalny wynik (tzw. MAX) to trzykrotne trafienie w potrójną dwudziestkę (Triple 20 = 3 x 60 pkt).",
  },
  {
    q: "Na jakiej standardowej wysokości od podłogi powinien znajdować się środek tarczy (Bullseye) według przepisów PDC?",
    options: ["170 cm", "173 cm", "178 cm", "183 cm"],
    correct: 1,
    fun: "Oficjalna wysokość to 1,73 metra (lub dokładnie 5 stóp i 8 cali) mierzona pionowo od poziomu podłogi do środka tarczy.",
  },
  {
    q: "Jaka jest oficjalna odległość linii rzutu (oche) od lica tarczy darterskiej w linii poziomej?",
    options: ["2,25 m", "2,37 m", "2,44 m", "2,50 m"],
    correct: 1,
    fun: "Odległość wynosi dokładnie 2,37 metra (7 stóp 9,25 cala) mierzona w poziomie od przedniej płaszczyzny tarczy.",
  },
  {
    q: "Jaka jest najmniejsza możliwa liczba rzutów (lotek) potrzebna do skończenia pojedynczego lega 501?",
    options: ["7", "8", "9", "10"],
    correct: 2,
    fun: "Tak zwana „dziewiąta lotka” (9-darter) to perfekcyjny leg i jedno z najbardziej prestiżowych osiągnięć w darcie.",
  },
  {
    q: "Jaki jest najwyższy możliwy finisz (zamknięcie lega) trzema lotkami w grze 501 double-out?",
    options: ["160", "167", "170", "180"],
    correct: 2,
    fun: "Słynny finisz „Big Fish” (170) uzyskuje się rzucając kolejno: T20 (60), T20 (60) oraz Bullseye (50).",
  },
  {
    q: "Co oznacza termin „Bust” (fura) w standardowej grze 501?",
    options: ["Upuszczenie lotki za linię rzutu", "Zredukowanie punktów poniżej zera, do 1 lub do 0 bez podwójnego pola", "Trafienie trzech jedynek w jednej kolejce", "Złamanie grota lotki podczas rzutu"],
    correct: 1,
    fun: "Gdy gracz zrobi „furę”, jego kolejka dobiega końca, a stan punktowy wraca do wartości sprzed rzutu w danej turze.",
  },
  {
    q: "Jak w żargonie darterskim nazywa się sekwencja rzutów: 1, 20, 1 i suma zaledwie 22 punktów w tury celowanej w T20?",
    options: ["Fish and Chips", "Breakfast (Śniadanie)", "Robin Hood", "Shanghai"],
    correct: 1,
    fun: "Określenie „Breakfast” (lub „Champagne Breakfast”) wzięło się z brytyjskiego slangu odnoszącego się do kosztu klasycznego śniadania wynoszącego dawniej 2 szylingi i 2 pensy (22 i 26 punktów).",
  },
  {
    q: "Co oznacza sytuacja zwana „Robin Hood”?",
    options: ["Oddanie wygranego meczu rywalowi", "Wbicie lotki bezpośrednio w shaft/piórko wcześniej rzuconej lotki", "Trafienie trzech różnych podwójnych pól w jednej kolejce", "Trafienie w sam środek tarczy z zamkniętymi oczami"],
    correct: 1,
    fun: "W sytuacji „Robin Hooda” wbita w piórko lotka nie dotyka tarczy, dlatego rzut ten przynosi 0 punktów.",
  },
  {
    q: "Czym charakteryzuje się finisz typu „Shanghai”?",
    options: ["Trafieniem trzech wartości pojedynczych w zewnętrzny ring", "Trafieniem w jednym numerze pola pojedynczego, podwójnego i potrójnego", "Zakończeniem lega poprzez trzykrotne trafienie w Bullseye", "Trafieniem trzech różnych liczb parzystych w jednej kolejce"],
    correct: 1,
    fun: "Klasyczny Shanghai Finish to zamknięcie odpowiedniej liczby (np. 120 punktów) poprzez trafienie Single 20, Double 20 i Triple 20.",
  },
  {
    q: "W którym roku czołowi gracze odłączyli się od BDO, tworząc WDC (późniejsze PDC)?",
    options: ["1985", "1992", "1998", "2002"],
    correct: 1,
    fun: "16 czołowych darterów (m.in. Phil Taylor, Eric Bristow) utworzyło World Darts Council w 1992 roku w proteście przeciwko spadkowi zainteresowania telewizji zawodami BDO.",
  },
  {
    q: "Kto jest rekordzistą pod względem liczby zdobytych tytułów mistrza świata PDC?",
    options: ["Michael van Gerwen", "Raymond van Barneveld", "Phil Taylor", "Gary Anderson"],
    correct: 2,
    fun: "Phil „The Power” Taylor zdobył łącznie 16 tytułów mistrza świata (w tym 14 w federacji PDC oraz 2 w BDO).",
  },
  {
    q: "W którym słynnym obiekcie w Londynie od 2008 roku tradycyjnie odbywają się Mistrzostwa Świata PDC?",
    options: ["Circus Tavern", "Alexandra Palace („Ally Pally”)", "Wembley Arena", "The O2 Arena"],
    correct: 1,
    fun: "W latach 1994–2007 turniej gościł w Circus Tavern w Purfleet, po czym przeniósł się do znacznie większego Alexandra Palace.",
  },
  {
    q: "Kto został pierwszym w historii polskim darterem, który zdobył tytuł w turnieju telewizyjnym PDC (World Cup of Darts)?",
    options: ["Krzysztof Kciuk", "Krzysztof Ratajski", "Sebastian Białecki", "Radek Szagański"],
    correct: 1,
    fun: "Krzysztof Ratajski przecierał szlaki dla polskiego darta, wygrywając liczne turnieje rangi Players Championship i docierając do czołówki rankingu PDC.",
  },
  {
    q: "Który z legendarnych zawodników nosi przydomek „Mighty Mike”?",
    options: ["Michael Smith", "Michael van Gerwen", "Mike De Decker", "Mervyn King"],
    correct: 1,
    fun: "Holender Michael van Gerwen to trzykrotny mistrz świata PDC i najmłodszy zwycięzca tego turnieju w historii (w wieku 24 lat).",
  },
  {
    q: "Jak potocznie nazywa się oficjalny ranking finansowy federacji PDC oparty na zarobkach z ostatnich dwóch lat?",
    options: ["PDC Golden List", "PDC Order of Merit", "World Dart Index", "PDC Money Ladder"],
    correct: 1,
    fun: "PDC Order of Merit wprowadzono w 2007 roku, zastępując tradycyjny system punktowy wartością wygranych nagród pieniężnych w funtach brytyjskich (£).",
  },
  {
    q: "Kto był pierwszym graczem, który rzucił perfekcyjnego 9-dartera transmitowanego na żywo w telewizji podczas turnieju PDC (World Matchplay 2002)?",
    options: ["Phil Taylor", "Raymond van Barneveld", "John Lowe", "Paul Lim"],
    correct: 0,
    fun: "Phil Taylor dokonał tego wyczynu w lipcu 2002 roku w meczu przeciwko Chrisowi Masonowi w Winter Gardens w Blackpool.",
  },
  {
    q: "Który z wymienionych turniejów PDC wyróżnia się unikalną zasadą „Double-In, Double-Out” (konieczność rozpoczęcia i skończenia lega podwójnym polem)?",
    options: ["World Matchplay", "World Grand Prix", "Grand Slam of Darts", "UK Open"],
    correct: 1,
    fun: "World Grand Prix to jedyny major PDC, w którym zawodnik musi trafić pole podwójne (lub bullseye), aby w ogóle rozpocząć naliczanie punktów w legu.",
  },
  {
    q: "Jaką nazwę nosi prestiżowy turniej PDC określany mianem „FA Cup darta” ze względu na brak rozstawień i otwarte losowanie w każdej rundzie?",
    options: ["UK Open", "European Championship", "Players Championship Finals", "World Series Finals"],
    correct: 0,
    fun: "UK Open pozwala amatorom z kwalifikacji pubowych na grę z najlepszymi graczami świata bez żadnego rozstawienia w drabince.",
  },
  {
    q: "Jak nazywał się legendarny brytyjski sędzia i „głos darta”, znany z charakterystycznego okrzyku „One Hundred and Eighty!”?",
    options: ["Russ Bray", "George Noble", "Kirk Bevins", "Paul Hinks"],
    correct: 0,
    fun: "Russ Bray (znany jako „The Voice”) sędziował najważniejsze finały PDC przez dekady i zakończył karierę sędziego scenicznego w 2024 roku.",
  },
]

/** Memory — pary symboli (emoji). Możesz podmienić na zdjęcia członków. */
export const MEMORY_SYMBOLS = ['🎯', '🏆', '🥇', '🍻', '🃏', '🍕']

/**
 * Memory — WŁASNE GRAFIKI (zamiast emoji).
 * Jak dodać:
 *   1) Wrzuć pliki graficzne (np. zdjęcia członków, logo, puchary) do katalogu public/memory/
 *      — nazwij je np. 01.jpg, 02.jpg, 03.jpg, 04.jpg, 05.jpg, 06.jpg (kwadraty ~512 px).
 *   2) Wypisz je w tej tablicy (ścieżka względna "./memory/…").
 *   3) Min. 3 grafiki (6 kart), najlepiej 6–8 (12–16 kart).
 * Jeśli tablica jest pusta, gra używa emoji z MEMORY_SYMBOLS.
 */
export const MEMORY_IMAGES = [
  // { src: './memory/01.jpg', label: 'Założyciele klubu' },
  // { src: './memory/02.jpg', label: 'Pierwszy puchar' },
  // { src: './memory/03.jpg', label: 'Tarcza 2015' },
  // { src: './memory/04.jpg', label: 'Logo klubu' },
  // { src: './memory/05.jpg', label: 'Wyjazd integracyjny' },
  // { src: './memory/06.jpg', label: 'Zjazd 10-lecia' },
]

/** Bingo klubowe — pula haseł (karta losuje 24 z nich + środek FREE). */
export const BINGO_POOL = [
'Możesz polecieć w balet, ale na gierkę wstać musisz',
'Ktoś próbuje trafić w podwójne po kilku kolejkach przy grillu',
'Śpiewanie „Jolki” przy ognisku/grillu do białego rana',
'Na turniej chyba nie dojechała głowa…',
'Ktoś opowiada przez cały wyjazd, jak kiedyś ograł faworyta w lega',
'Zamiast w T20 wpadają piękne 26 punktów',
'Rzucenie upragnionego MAX-a (180 pkt) przy wiwatach całego domku',
'Ktoś tłumaczy zły rzut „idealnie wymierzoną zawartością alkoholu we krwi”',
'Tekst: „Wyników nie dowozimy, ale fajne z nas chłopaki”',
'Prezes przejmuje kontrolę nad grillem lub losowaniem grup',
'Gracz w darta nagle wciela się w rolę trenera i instruuje innych',
'Ktoś odpada z zabawy pierwszy i idzie spać przed 22:00',
'Przypalona kiełbasa lub karkówka na ruszcie',
'Toast: „Bez formy, bez chęci, ale przynajmniej bez talentu!”',
'Ktoś szuka zaginionej lotki pod kanapą lub w trawie przy domku',
'Trzoda w bani',
'Darcie japy po trafieniu w Bullseye',
'Pojawia się dyskusja o sponsoringu od WujaMeb lub Kari&MiłoBud',
'Ktoś rano wstaje w okularach przeciwsłonecznych i walczy o przetrwanie',
'Pierdole tą gre',
'Ktoś chwali się zbieraniem szlifów na „warszawskich obiektach”',
'Nocne debaty o sensie życia',
'Wbicie lotki typu „Robin Hood” (lotka w piórko drugiej lotki)',
'Planowanie kolejnego turnieju, zanim ten wyjazd się w ogóle skończy',
]
