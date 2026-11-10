import { worksRepository } from "../../lib/worksRepository";
import type { WorkReadingData } from "./types";

export const demoReadingLibrary: Record<string, WorkReadingData> = {
  "atlas-das-mares": {
    workId: "atlas-das-mares",
    title: "Atlas das marés esquecidas",
    author: "Lia Mavume",
    format: "Romance",
    mode: "prose",
    chapters: [
      {
        id: "cap-1",
        number: 1,
        title: "A carta náutica sem nome",
        content: `A água recuava com uma lentidão calculada, como se o próprio oceano hesitasse em revelar os segredos que guardara durante trinta invernos.

Naquela manhã de maré-viva, Lia desceu ao cais antes que o nevoeiro da barra se dissipasse. Levava consigo o estojo de latão herdado do avô: compasso de pontas secas, pena de bico metálico e um rolo de pergaminho vegetal que cheirava a salitre e a resina de pinheiro.

"Nenhuma ilha permanece no mesmo lugar quando a maré baixa duas braças além da conta," costumava dizer o velho timoneiro de Porto-Vento. Na altura, Lia considerava a frase uma daquelas metáforas de taberna com que os marinheiros explicavam as rotas perdidas. Mas ali, sob a luz cinzenta das seis da manhã, a linha do horizonte partira-se.

O banco de areia ocidental, onde habitualmente só as gaivotas arriscavam pousar, emergira como uma espinha dorsal de calcário negro. Entre as poças deixadas pelo refluxo, sobressaíam restos de alvenaria esculpida — arcos que não podiam ter sido erguidos pelo mar, canais que obedeciam a uma geometria humana esquecida.

Lia desenrolou a folha em branco sobre a caixa de amarras. A primeira linha traçada não foi o contorno da praia, mas a coordenada exata onde o farol da ponta deixava de projetar sombra. O mapa que começava a desenhar não serviria para navegar no presente: serviria para provar que uma cidade inteira dormia debaixo das ondas, à espera apenas da maré certa para respirar.`,
      },
      {
        id: "cap-2",
        number: 2,
        title: "O som das pedras submersas",
        content: `Havia um som particular que a maré fazia quando encontrava pedra talhada em vez de rocha viva. Era um murmúrio oco, quase musical, como o ar a escapar de ânforas antigas.

Lia caminhou descalça pelo leito exposto. O lodo era frio e firme, marcado por estrias que imitavam dunas submarinas. A cada dez passos, cravava a vara de sondagem de freixo no solo lodoso. Três palmos de areia, e logo a madeira embatia numa superfície plana, polida, sem cracas.

"Pavimento," sussurrou para o caderno de campo, registando a inclinação com o sextante de bolso. "Declive de três graus para sudeste. Uma avenida monumental."

Ao longe, a sirene do quebra-mar anunciou a viragem da maré. Tinha apenas quarenta minutos antes que as primeiras línguas de espuma verde começassem a cobrir novamente os arcos esquecidos. A pressa de um cartógrafo nunca é veloz; é rigorosa. Cada ângulo medido com erro de meio minuto tornaria o mapa inútil na maré seguinte.

Recolheu uma lasca de cerâmica azul-escura presa numa fenda. Na face interna, um fragmento de inscrição: três caracteres arcaicos que sopravam um nome antigo de cidade. Guardou a cerâmica no bolso do casaco de oleado e sentiu o peso do passado a puxar-lhe a mão em direção ao abismo sereno do mar.`,
      },
      {
        id: "cap-3",
        number: 3,
        title: "A linha entre a névoa e a memória",
        content: `A névoa começou a cerrar-se sobre o baixio antes mesmo da água regressar. Era uma névoa espessa, branca, carregada com o cheiro adocicado de algas em fermentação que os pescadores da enseada chamavam de 'véu de névoa'.

Lia não levantou a cabeça do desenho até a água lhe molhar os nós dos dedos dos pés.

Tracejou o contorno do baluarte central, calculando a distância pelo eco da arrebentação contra o farol. Três mil braças para oeste; duas mil para norte. Se as proporções estivessem certas, a cidade não fora engolida por um cataclismo repentino, mas abandonada palmo a palmo à medida que o mar subia.

Quando finalmente dobrou o pergaminho e o selou no tubo de latão estanque, a água já lhe cobria os tornozelos. Olhou para trás uma última vez. Os arcos negros estavam a desaparecer sob o verde escuro das marés. Durante mais um mês lunar, ninguém mais os veria. Mas agora, pela primeira vez em três séculos, existia um mapa.`,
      },
    ],
  },
  "silencio-orbita": {
    workId: "silencio-orbita",
    title: "O silêncio em órbita",
    author: "Íris Vale",
    format: "Poesia",
    mode: "poetry",
    chapters: [
      {
        id: "cap-1",
        number: 1,
        title: "I. Equinócio das distâncias",
        stanzas: [
          [
            "Dois corpos em vazio não colidem por pressa:",
            "obedecem à curvatura que o silêncio lhes impõe,",
            "um rastro de poeira fria",
            "onde outrora houve calor de estrela.",
          ],
          [
            "Tento medir o intervalo entre o teu nome",
            "e a velocidade com que a luz se cansa",
            "de atravessar a sala deserta.",
          ],
          [
            "Não há gravidade no adeus,",
            "apenas a lenta deserção",
            "dos eixos que nos mantinham virados",
            "para o mesmo lado do dia.",
          ],
        ],
      },
      {
        id: "cap-2",
        number: 2,
        title: "II. Constelações menores",
        stanzas: [
          [
            "Inventamos nomes para o escuro",
            "porque o escuro desprovido de sílabas",
            "pesa demais sobre o peito.",
          ],
          [
            "Chamaste àquela lâmpada acesa no cais",
            "a estrela da partida.",
            "Eu chamei-lhe fósforo",
            "a arder na ponta dos teus dedos.",
          ],
          [
            "O universo expande-se",
            "à mesma medida com que aprendemos",
            "a não fazer perguntas à noite.",
          ],
        ],
      },
      {
        id: "cap-3",
        number: 3,
        title: "III. Retorno à atmosfera",
        stanzas: [
          [
            "A descida é sempre um fogo súbito:",
            "o atrito de voltar a ser carne,",
            "de respirar o ar denso da terra",
            "depois de meses a flutuar sem peso.",
          ],
          [
            "Deixa as botas à porta.",
            "Trazem terra molhada de um planeta",
            "que já tínhamos esquecido como pisar.",
          ],
        ],
      },
    ],
  },
  "cidade-entre-linhas": {
    workId: "cidade-entre-linhas",
    title: "A cidade entre linhas",
    author: "Tomás Nilo",
    format: "HQ / Comic",
    mode: "comic",
    chapters: [
      {
        id: "cap-1",
        number: 1,
        title: "Prólogo: O algoritmo cego",
        pages: [
          {
            id: "p-1",
            number: 1,
            title: "Plano Geral da Metrópole",
            description:
              "Um horizonte infinito de arranha-céus cinzelados em fibra de carbono e vidro opaco. Linhas de dados luminescentes cruzam o céu em arcos geométricos perfeitos sob uma chuva fina e contínua.",
            aspectRatio: "3/4",
            accentColor: "#1A2B44",
            caption:
              "SECTOR 09 — 04:12 AM. 'A cidade foi projetada para não deixar esquinas ao acaso.'",
          },
          {
            id: "p-2",
            number: 2,
            title: "O Estúdio na Rua dos Cabos",
            description:
              "Interior de uma oficina abarrotada de cadernos de papel antigo, frascos de nanquim e telas holográficas suspensas por cabos trançados. O protagonista encara uma planta urbana desdobrada na mesa de luz.",
            aspectRatio: "3/4",
            accentColor: "#22354F",
            caption:
              "'Se a grelha urbana é perfeita, porque razão o contador de passos acusa duzentos metros a mais entre a ponte e a avenida?'",
          },
          {
            id: "p-3",
            number: 3,
            title: "A Fratura no Asfalto",
            description:
              "Close dramático nos ténis gastos do ilustrador pisando uma calçada estreita ladeada por tijolo artesanal — um material banido há décadas. Nenhuma câmara de vigilância aponta para aquele beco.",
            aspectRatio: "3/4",
            accentColor: "#2A3F5E",
            caption:
              "Uma rua sem código. Uma ausência calculada ou uma memória que sobreviveu à digitalização?",
          },
          {
            id: "p-4",
            number: 4,
            title: "O Primeiro Traço no Caderno",
            description:
              "A mão com uma caneta bico de pena tocando o papel. No fundo, a silhueta de uma torre de retransmissão apagada pela primeira vez em cinquenta anos.",
            aspectRatio: "3/4",
            accentColor: "#14243B",
            caption: "Continua no Capítulo 2: 'A Arquitetura dos Fantasmas'.",
          },
        ],
      },
    ],
  },
  "jardim-lua": {
    workId: "jardim-lua",
    title: "O jardim da última lua",
    author: "Ren Aoki",
    format: "Mangá",
    mode: "manga",
    chapters: [
      {
        id: "cap-1",
        number: 1,
        title: "Ato I: A flor que não adormece",
        pages: [
          {
            id: "m-1",
            number: 1,
            title: "Página de Abertura (RTL: Direita para a Esquerda)",
            description:
              "Traçado tradicional em preto e branco com retículas minuciosas. Um portão torii de pedra coberto por musgo bioluminescente, vigiado por duas estátuas de raposa com lanternas de óleo acesas.",
            aspectRatio: "3/4",
            accentColor: "#171F2C",
            caption:
              "【頁一】 Na colina dos cem pinheiros, o sol pôs-se há sete semanas e não voltou a erguer-se.",
          },
          {
            id: "m-2",
            number: 2,
            title: "O Diálogo no Invernadouro",
            description:
              "Painel dinâmico dividido em diagonais. A jovem jardineira Akari inspeciona pétalas prateadas que flutuam sem peso dentro de um frasco de vidro graduado.",
            aspectRatio: "3/4",
            accentColor: "#1D2738",
            caption:
              "【頁二】 'Se a seiva da lua congelar antes da alvorada, as raízes nunca mais despertarão.'",
          },
          {
            id: "m-3",
            number: 3,
            title: "A Passagem Secreta",
            description:
              "Grande plano de página inteira. Uma escadaria de raízes entrelaçadas desce para a gruta subterrânea onde pulsa a semente primordial.",
            aspectRatio: "3/4",
            accentColor: "#253347",
            caption:
              "【頁三】 O início da jornada pelo vale eterno. (Fim do Ato I)",
          },
        ],
      },
    ],
  },
};

export function getWorkReadingData(
  workId: string,
  format?: string,
  title?: string,
  author?: string,
): WorkReadingData | undefined {
  if (!worksRepository.find(workId)) return undefined;
  if (demoReadingLibrary[workId]) {
    return demoReadingLibrary[workId];
  }

  // Derive default data based on format
  const isVisual =
    format === "HQ / Comic" ||
    format === "Mangá" ||
    format === "Obra ilustrada";
  const isPoetry = format === "Poesia";
  const mode: "prose" | "poetry" | "comic" | "manga" =
    format === "Mangá"
      ? "manga"
      : isVisual
        ? "comic"
        : isPoetry
          ? "poetry"
          : "prose";

  return {
    workId,
    title: title || "História de Demonstração",
    author: author || "Autor Arquivo Global",
    format: format || "Romance",
    mode,
    chapters: [
      {
        id: "cap-1",
        number: 1,
        title: "Capítulo de Amostra",
        pages: isVisual
          ? [
              {
                id: "p-1",
                number: 1,
                title: "Página de amostra",
                description: "Composição visual demonstrativa desta obra.",
                aspectRatio: "3/4",
                accentColor: "#14243B",
              },
            ]
          : undefined,
        content: `Este é um capítulo de amostra preparado para demonstrar as capacidades do leitor da plataforma.

A leitura no Arquivo Global foi concebida para oferecer máximo conforto tipográfico tanto em telas compactas como em monitores de alta resolução. As opções de leitura permitem ajustar corpo da letra, largura de linha e contraste visual sem comprometer a integridade da obra.`,
      },
    ],
  };
}
