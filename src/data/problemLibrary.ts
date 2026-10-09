import { SupportStep } from '../types';

export interface LibraryCategory {
  id: string;
  name: string;
  icon: string;
  description: string;
  problems: {
    id: string;
    title: string;
    description: string;
    steps: SupportStep[];
  }[];
}

export const PROBLEM_LIBRARY: LibraryCategory[] = [
  {
    id: 'internet',
    name: 'Internet & Wi-Fi',
    icon: 'Wifi',
    description: 'Problemen met webpagina\'s of draadloos internet',
    problems: [
      {
        id: 'no-wifi',
        title: 'Mijn Wi-Fi / Internet werkt niet',
        description: 'U kunt geen websites openen of het internet lijkt weg te zijn.',
        steps: [
          {
            stepNumber: 1,
            totalEstimatedSteps: 3,
            title: 'Kijk rechtsonder op het scherm',
            instruction: 'Kijk helemaal rechtsonder op uw beeldscherm. Ziet u daar een icoontje van een wereldbolletje of een Wi-Fi boogje? Klik daar één keer op met de linkermuisknop.',
            detailedTip: 'Dit icoontje staat naast de datum en tijd op de balk onderin.',
            visualHint: {
              targetArea: 'bottom-right',
              label: 'Klik op het Wi-Fi of Wereldbol symbool rechtsonder',
              positionX: 92,
              positionY: 94
            }
          },
          {
            stepNumber: 2,
            totalEstimatedSteps: 3,
            title: 'Controleer of Wi-Fi aanstaat',
            instruction: 'Kijk of het knopje "Wi-Fi" blauw gekleurd is. Als het knopje grijs is, klik er dan op om het blauw (aan) te maken.',
            detailedTip: 'Als het knopje al blauw is, klik dan op uw eigen netwerknaam (bijv. Ziggo, KPN of Odido) en kies "Verbinden".',
            visualHint: {
              targetArea: 'bottom-right',
              label: 'Controleer de blauwe Wi-Fi knop',
              positionX: 80,
              positionY: 80
            }
          },
          {
            stepNumber: 3,
            totalEstimatedSteps: 3,
            title: 'Controleer het internetkastje (modem)',
            instruction: 'Werkt het nog niet? Kijk naar het zwarte of witte internetkastje in uw huis. Brandt het lampje groen of brandt er een rood/oranje lampje?',
            detailedTip: 'Vaak helpt het om de stekker van het internetkastje er even 1 minuut uit te halen en weer terug te steken.',
            visualHint: {
              targetArea: 'cable',
              label: 'Controleer het modemkastje in huis'
            }
          }
        ]
      },
      {
        id: 'slow-internet',
        title: 'Het internet is erg langzaam',
        description: 'Pagina\'s laden traag of video\'s blijven haperen.',
        steps: [
          {
            stepNumber: 1,
            totalEstimatedSteps: 2,
            title: 'Sluit openstaande tabbladen',
            instruction: 'Kijk bovenaan in uw internetprogramma. Sluit alle tabbladen die u niet gebruikt door op het kleine kruisje (x) te klikken.',
            detailedTip: 'Te veel open tabbladen kunnen uw internet vertragen.',
            visualHint: {
              targetArea: 'top-left',
              label: 'Sluit onnodige tabbladen via het kruisje (x)',
              positionX: 30,
              positionY: 6
            }
          },
          {
            stepNumber: 2,
            totalEstimatedSteps: 2,
            title: 'Herstart uw internetprogramma',
            instruction: 'Sluit uw internetprogramma (zoals Chrome of Edge) helemaal af met het rode kruis rechtsboven, en open het daarna opnieuw.',
            visualHint: {
              targetArea: 'top-right',
              label: 'Rood kruisje rechtsboven',
              positionX: 98,
              positionY: 4
            }
          }
        ]
      }
    ]
  },
  {
    id: 'printer',
    name: 'Printer',
    icon: 'Printer',
    description: 'Printer print niet, staat offline of papier zit vast',
    problems: [
      {
        id: 'printer-offline',
        title: 'Mijn printer doet het niet / is offline',
        description: 'U wilt iets afdrukken maar er gebeurt niets.',
        steps: [
          {
            stepNumber: 1,
            totalEstimatedSteps: 3,
            title: 'Staat de printer aan?',
            instruction: 'Kijk naar uw printer. Brandt het aan/uit-lampje op de printer zelf?',
            detailedTip: 'Als er geen enkel lampje brandt, druk dan één keer op de aan/uit-knop van de printer.',
            visualHint: {
              targetArea: 'center',
              label: 'Controleer de aan/uit knop en het lampje op de printer'
            }
          },
          {
            stepNumber: 2,
            totalEstimatedSteps: 3,
            title: 'Controleer papier en klepjes',
            instruction: 'Kijk of er voldoende wit papier in de papierlade ligt en of alle klepjes van de printer goed dichtgedrukt zijn.',
            detailedTip: 'Soms knippert er een oranje lampje als het papier op is of een klepje openstaat.',
            visualHint: {
              targetArea: 'center',
              label: 'Controleer de papierlade'
            }
          },
          {
            stepNumber: 3,
            totalEstimatedSteps: 3,
            title: 'Zet de printer even uit en weer aan',
            instruction: 'Druk op de uit-knop van de printer, wacht 15 rustige tellen, en zet de printer weer aan.',
            detailedTip: 'Hierdoor wist de printer oude vastgelopen printopdrachten.',
            visualHint: {
              targetArea: 'center',
              label: 'Herstart de printer'
            }
          }
        ]
      },
      {
        id: 'paper-jam',
        title: 'Het papier zit vast in de printer',
        description: 'Er zit een vel papier klem in het apparaat.',
        steps: [
          {
            stepNumber: 1,
            totalEstimatedSteps: 2,
            title: 'Zet de printer eerst uit',
            instruction: 'Zet de printer uit met de aan/uit knop voor uw veiligheid.',
            visualHint: {
              targetArea: 'center',
              label: 'Zet printer uit'
            }
          },
          {
            stepNumber: 2,
            totalEstimatedSteps: 2,
            title: 'Trek het papier rustig recht naar u toe',
            instruction: 'Open de voorklep en trek het vastzittende papier heel rustig en met twee handen recht naar u toe, zodat het niet scheurt.',
            detailedTip: 'Sluit daarna de klep weer en zet de printer aan.',
            visualHint: {
              targetArea: 'center',
              label: 'Trek papier voorzichtig rechtuit'
            }
          }
        ]
      }
    ]
  },
  {
    id: 'computer',
    name: 'Computer & Snelheid',
    icon: 'Laptop',
    description: 'Computer is traag, zit vast of start niet goed op',
    problems: [
      {
        id: 'slow-pc',
        title: 'Mijn computer is erg langzaam',
        description: 'Alles reageert traag of het zandlopertje/cirkeltje blijft draaien.',
        steps: [
          {
            stepNumber: 1,
            totalEstimatedSteps: 2,
            title: 'Sluit programma\'s die u niet gebruikt',
            instruction: 'Kijk naar de balk helemaal onderaan het scherm. Sluit programma\'s die u op dit moment niet nodig heeft.',
            detailedTip: 'U kunt met de rechtermuisknop op een icoon onderin klikken en kiezen voor "Venster sluiten".',
            visualHint: {
              targetArea: 'bottom-left',
              label: 'Taakbalk onderaan met open programma\'s',
              positionX: 30,
              positionY: 96
            }
          },
          {
            stepNumber: 2,
            totalEstimatedSteps: 2,
            title: 'Herstart uw computer een keer rustig',
            instruction: 'Klik linksonder op de Windows startknop, klik op het Aan/Uit icoon, en kies "Opnieuw opstarten".',
            detailedTip: 'Laat de computer even rustig zijn werk doen. Na het herstarten is het geheugen weer helemaal fris en schoon.',
            visualHint: {
              targetArea: 'bottom-left',
              label: 'Startknop linksonder -> Aan/Uit -> Opnieuw opstarten',
              positionX: 3,
              positionY: 96
            }
          }
        ]
      },
      {
        id: 'frozen-app',
        title: 'Een programma loopt vast / reageert niet',
        description: 'Het scherm staat stil en u kunt nergens meer op klikken.',
        steps: [
          {
            stepNumber: 1,
            totalEstimatedSteps: 2,
            title: 'Wacht even 30 seconden',
            instruction: 'Raak muis en toetsenbord even 30 seconden niet aan. Soms is de computer een grote bewerking aan het afronden.',
            visualHint: {
              targetArea: 'center',
              label: 'Even rustig wachten'
            }
          },
          {
            stepNumber: 2,
            totalEstimatedSteps: 2,
            title: 'Sluit het vastgelopen venster met Alt + F4',
            instruction: 'Houd op uw toetsenbord de toets "Alt" ingedrukt (links van de lange spatiebalk) en druk tegelijk één keer op de toets "F4" (bovenaan het toetsenbord).',
            detailedTip: 'Hiermee dwingt u het actieve programma om direct te sluiten.',
            visualHint: {
              targetArea: 'keyboard',
              label: 'Druk Alt + F4 tegelijk in'
            }
          }
        ]
      }
    ]
  },
  {
    id: 'sound',
    name: 'Geluid & Microfoon',
    icon: 'Volume2',
    description: 'Geen geluid, te zacht of microfoon werkt niet',
    problems: [
      {
        id: 'no-sound',
        title: 'Ik hoor geen geluid uit de computer',
        description: 'Filmpjes, muziek of spraak zijn stil.',
        steps: [
          {
            stepNumber: 1,
            totalEstimatedSteps: 2,
            title: 'Kijk rechtsonder naar het luidspreker-icoon',
            instruction: 'Kijk helemaal rechtsonder op het beeldscherm (naast de tijd). Ziet u een luidsprekertje met een kruisje of streep erdoor? Klik erop met de linkermuisknop.',
            detailedTip: 'Schuif de volumebalk naar rechts (naar ongeveer 70 of 80).',
            visualHint: {
              targetArea: 'bottom-right',
              label: 'Luidspreker icoon rechtsonder',
              positionX: 88,
              positionY: 95
            }
          },
          {
            stepNumber: 2,
            totalEstimatedSteps: 2,
            title: 'Controleer een eventuele koptelefoon of boxen',
            instruction: 'Zit er een koptelefoon of oordopjes in de zijkant van de computer? Haal deze er even uit om te kijken of het geluid dan wel uit de computer komt.',
            visualHint: {
              targetArea: 'cable',
              label: 'Controleer audiokabel of koptelefoon'
            }
          }
        ]
      }
    ]
  },
  {
    id: 'display',
    name: 'Beeld & Tekstgrootte',
    icon: 'Monitor',
    description: 'Tekst te klein om te lezen of scherm te donker',
    problems: [
      {
        id: 'text-too-small',
        title: 'De letters op het scherm zijn te klein',
        description: 'U wilt webpagina\'s of teksten groter maken om makkelijker te kunnen lezen.',
        steps: [
          {
            stepNumber: 1,
            totalEstimatedSteps: 1,
            title: 'Houd Ctrl ingedrukt en druk op het Plus-teken',
            instruction: 'Houd op uw toetsenbord de toets "Ctrl" ingedrukt (linksonder op het toetsenbord) en druk tegelijk op de "+" (plus-toets). Herhaal dit tot de tekst groot genoeg is!',
            detailedTip: 'Tip: Met Ctrl en de min-toets (-) maakt u letters weer kleiner.',
            visualHint: {
              targetArea: 'keyboard',
              label: 'Druk Ctrl en + tegelijk in'
            }
          }
        ]
      }
    ]
  },
  {
    id: 'email',
    name: 'E-mail & Berichten',
    icon: 'Mail',
    description: 'E-mail opent niet of u twijfelt over een bericht',
    problems: [
      {
        id: 'email-wont-open',
        title: 'Mijn e-mailprogramma opent niet',
        description: 'Outlook of webmail wil niet starten.',
        steps: [
          {
            stepNumber: 1,
            totalEstimatedSteps: 2,
            title: 'Controleer eerst of u internet heeft',
            instruction: 'Open uw gewone internetprogramma en kijk of u een gewone website (zoals nos.nl of google.nl) kunt openen.',
            visualHint: {
              targetArea: 'center',
              label: 'Open een website in de browser'
            }
          },
          {
            stepNumber: 2,
            totalEstimatedSteps: 2,
            title: 'Log opnieuw in via de website van uw provider',
            instruction: 'Ga via uw browser naar de webmail van uw provider (bijv. kpnmail.nl, ziggo.nl, of gmail.com) om uw berichten direct te bekijken.',
            visualHint: {
              targetArea: 'top-left',
              label: 'Adresbalk bovenaan de browser',
              positionX: 30,
              positionY: 8
            }
          }
        ]
      }
    ]
  }
];

export function findLibraryProblem(keywordOrId: string) {
  const query = keywordOrId.toLowerCase().trim();
  for (const cat of PROBLEM_LIBRARY) {
    for (const prob of cat.problems) {
      if (
        prob.id === query ||
        prob.title.toLowerCase().includes(query) ||
        query.includes(prob.id)
      ) {
        return prob;
      }
    }
  }
  return null;
}
