// The guide's text in Spanish. Page ids and the number of points must match en.ts.
import type { CodexText } from '../../ui/help/codexData';

export const codexEs: CodexText = {
  categories: {
    basics: 'Lo básico',
    teaching: 'Enseñar',
    students: 'Tus alumnos',
    scores: 'Examen y notas',
    courses: 'Lecciones y cursos',
    ai: 'IA y ajustes',
  },
  pages: {
    'goal': {
      title: 'De qué va este juego',
      intro: 'Eres el profesor de una clase de diez alumnos interpretados por una IA. No saben nada del tema de hoy salvo lo que tú les enseñes. Al final hacen un examen usando solo sus apuntes, así que sus notas muestran lo bien que has enseñado.',
      points: [
        'El objetivo real es que tú aprendas la materia. Para responder a un alumno que pregunta "¿por qué?" o "¿y si…?", tienes que entenderla tú.',
        'Cada alumno es distinto: unos atienden bien, otros se distraen y otros llegan con ideas erróneas que tienes que corregir.',
        'No hay una única forma correcta de enseñar. Explica, pon ejemplos, haz preguntas, usa la pizarra.',
      ],
    },
    'lesson': {
      title: 'Una lección, paso a paso',
      intro: 'Todas las lecciones siguen el mismo camino: eliges una lección, la das, tocas el timbre y lees el boletín.',
      points: [
        'Elegir: en la pantalla de lecciones, pulsa Dar clase junto a una lección. Se sacan diez alumnos de un grupo de treinta.',
        'Estudiar: lee los objetivos y los apuntes de estudio, y mira qué ideas erróneas pueden traer los alumnos.',
        'Enseñar: habla, escribe en la pizarra, responde preguntas, comprueba que lo entienden.',
        'Tocar el timbre: los alumnos hacen un examen de seis preguntas con sus apuntes.',
        'Boletín: mira la media de la clase, cada respuesta y tres consejos para la próxima vez. Luego intenta superar tu mejor nota.',
      ],
    },
    'prepare': {
      title: 'Estudiar antes de enseñar',
      intro: 'Antes de cada lección, una pantalla de estudio muestra lo que vas a enseñar: los objetivos, los apuntes de estudio y las ideas erróneas con las que llegarán algunos alumnos. Léela primero; no puedes enseñar lo que no entiendes.',
      points: [
        'Las preguntas del examen están ocultas. Cada una evalúa uno de los objetivos.',
        'Piensa cómo vas a corregir cada idea errónea, no solo cómo explicar la idea correcta.',
        'Durante la lección, "Apuntes de la lección" en el menú ☰ vuelve a abrir esos mismos apuntes.',
        'Marca "Saltar esta pantalla la próxima vez" para ir directo a clase. Puedes volver a activarla en Ajustes.',
        'Cuando tus clases fallan una y otra vez un objetivo de una lección, aparece como "Se suele fallar" en la pantalla de lecciones y en la de estudio.',
      ],
    },
    'turns': {
      title: 'Turnos y reloj',
      intro: 'Una lección dura 20 turnos o 15 minutos reales, lo que llegue antes. El reloj de la barra de arriba lo muestra como una clase de 45 minutos.',
      points: [
        'Un turno es pulsar una vez "Decir" (o Intro), o una vez "Escribir en la pizarra".',
        'Escribir directamente en la pizarra cuenta como un turno cuando haces clic fuera de ella.',
        'Cambiar de pizarra, dar la palabra a un alumno y preguntar a la clase no gastan turno.',
        'Cuando se acaban los turnos o el tiempo, el timbre suena solo.',
        'Con un plan de IA gratis con límite diario, el timbre también suena antes si solo quedan las peticiones justas para el examen.',
      ],
    },
    'bell': {
      title: 'Tocar el timbre',
      intro: 'Pulsa "Tocar el timbre" cuando hayas enseñado todo lo que querías. No hay premio por gastar los 20 turnos.',
      points: [
        'Antes de tocarlo, mira el panel de objetivos: un objetivo en 0/10 significa que nadie lo tiene en sus apuntes, así que nadie puede responder a su pregunta.',
        'El boletín menciona las manos que siguen levantadas al sonar el timbre.',
        'El examen tarda un poco: la IA responde por cada alumno y luego corrige las respuestas escritas.',
      ],
    },
    'talking': {
      title: 'Hablar a la clase',
      intro: 'Escribe lo que dirías en voz alta y pulsa Intro (o "Decir"). Todos los alumnos lo oyen y algunos toman apuntes.',
      points: [
        'Los alumnos solo aprenden lo que dices, escribes o dibujas. Si nunca mencionas algo, nadie lo sabe.',
        'Si dices algo incorrecto, los alumnos lo apuntan tal cual y lo usan en el examen.',
        'Las frases cortas y claras funcionan mejor que un discurso largo. Los ejemplos ayudan a los alumnos con dificultades.',
        'Mayús+Intro empieza una línea nueva sin enviar.',
      ],
    },
    'asking': {
      title: 'Hacer preguntas',
      intro: 'Las preguntas te muestran lo que los alumnos han entendido de verdad, y mantienen despierta a la clase.',
      points: [
        'Termina una frase con signo de interrogación y un alumno responde en voz alta. Primero el que tenga la mano levantada; si no, se elige a alguien.',
        'Pon el nombre de un alumno en tu frase ("Maya, ¿por qué funciona eso?") y responde ese alumno, nadie más.',
        '"Preguntar a la clase" sin nada escrito pregunta si alguien tiene alguna duda.',
        'Cuando un alumno responde, un compañero puede levantar la mano para estar de acuerdo, discrepar o añadir algo.',
        'Confirma o corrige siempre una respuesta en voz alta. Una respuesta que ignoras puede acabar de oídas en los apuntes de otros alumnos.',
      ],
    },
    'calling': {
      title: 'Manos levantadas y dar la palabra',
      intro: 'Los alumnos levantan la mano cuando quieren preguntar o decir algo. Una mano levantada se ve como un brazo que se agita en el aula y una burbuja ✋.',
      points: [
        'Haz clic en el pupitre de un alumno con la mano levantada para oír lo que quiere decir.',
        'El botón ✋ junto al alumno seleccionado muestra cuántas manos hay levantadas y salta a la siguiente.',
        '"Dar la palabra" a un alumno: si tiene la mano levantada, habla; si has escrito una pregunta, la responde; si no has escrito nada, se le invita a preguntar.',
        'Los alumnos hacen preguntas de verdad sobre la lección: por qué, qué pasaría si, dónde deja de funcionar la regla. Responderlas bien es el corazón del juego.',
        '🔊 debajo de la casilla de texto repite lo que dijo el alumno seleccionado.',
      ],
    },
    'board': {
      title: 'La pizarra',
      intro: 'Los alumnos copian lo que escribes en la pizarra, a menudo con más fidelidad que lo que dices. Escribe ahí los puntos clave.',
      points: [
        'Haz clic en la pizarra y escribe, o escribe en la casilla de abajo y pulsa "Escribir en la pizarra".',
        'Selecciona palabras en la pizarra para borrarlas o reescribirlas. "Borrar selección" hace lo mismo con un botón.',
        '"Borrar la pizarra" la deja limpia; "Deshacer borrado" la recupera.',
        'Borrar solo hace que los alumnos dejen de copiar a partir de ahora. Lo que ya apuntaron se queda en sus cuadernos.',
        '"Pizarra grande" muestra una pizarra más grande con las caras de los alumnos debajo.',
      ],
    },
    'speaking': {
      title: 'Hablar en vez de escribir',
      intro: 'Pulsa 🎤 junto a la casilla de texto y habla. Tus palabras aparecen en la casilla mientras hablas.',
      points: [
        'No se envía nada solo. Lee lo que se ha oído, corrige los fallos y pulsa Decir o Intro.',
        'Pulsa ■ Parar, o empieza a escribir, para dejar de escuchar.',
        'Funciona en Chrome, Edge y Safari. Firefox no tiene reconocimiento de voz, así que ahí no aparece el botón.',
        'La primera vez, el navegador pide permiso para usar el micrófono. Si lo denegaste, permítelo desde el icono a la izquierda de la barra de direcciones.',
        'En Chrome y Edge el audio se envía al fabricante del navegador para pasarlo a texto.',
      ],
    },
    'slides': {
      title: 'Varias pizarras, como diapositivas',
      intro: 'Cuando una pizarra está llena, empieza una nueva en vez de borrarla. Cada pizarra conserva su texto.',
      points: [
        '"Nueva pizarra" añade una pizarra limpia (hasta 12). ◀ y ▶ pasan de una pizarra a otra.',
        'La clase solo ve la pizarra que se muestra.',
        'Mostrar una pizarra por primera vez cuenta como material nuevo. Volver a una que ya vieron no cuesta nada y no la copian dos veces.',
        'Cambiar de pizarra no gasta turno.',
      ],
    },
    'pictures': {
      title: 'Dibujos e imágenes',
      intro: 'Con un modelo de IA que pueda leer imágenes, puedes dibujar con tiza en la pizarra o añadir una imagen, y los alumnos la ven.',
      points: [
        'Los modelos Gemini pueden leer imágenes. OpenRouter marca cuáles de sus modelos pueden. Para un modelo local que pueda, marca "Mi modelo puede leer imágenes" en Ajustes.',
        'Con cualquier otro modelo, las herramientas de dibujo están ocultas.',
        '"Dibujar" convierte el ratón o el dedo en tiza, en cuatro colores. Pulsa "Dejar de dibujar" para volver a escribir.',
        'Una imagen nueva cuenta como un turno. Puedes añadir unas palabras sobre lo que muestra.',
      ],
    },
    'students': {
      title: 'Quiénes son tus alumnos',
      intro: 'Cada clase tiene diez alumnos. Seis son uno de cada tipo de abajo; los otros cuatro son alumnos normales con sus propias costumbres.',
      points: [
        'Entusiasta: atiende bien, pregunta mucho, quiere definiciones exactas.',
        'Callado: entiende mucho pero nunca habla si no le das la palabra. El silencio no significa que lo entienda.',
        'Payaso de la clase: se distrae fácilmente y pregunta con una broma, pero la pregunta va en serio.',
        'Escéptico: pregunta "¿por qué?" y nota cuando algo no cuadra.',
        'Portador de ideas erróneas: llega convencido de dos ideas equivocadas sobre el tema.',
        'Con dificultades: necesita palabras sencillas, una idea cada vez y ejemplos.',
      ],
    },
    'moods': {
      title: 'Estados de ánimo y burbujas',
      intro: 'Cada alumno muestra cómo se siente con su cara y una burbuja junto a la cabeza. Una mano levantada siempre tiene prioridad sobre el ánimo. Los alumnos tímidos esconden que están perdidos: parecen tranquilos hasta que haces una pregunta a la clase o les hablas.',
      points: [
        'El ánimo pasa de un turno al siguiente; no se reinicia.',
        'Un alumno aburrido toma menos apuntes, así que el aburrimiento cuesta puntos en el examen.',
        'Los ejemplos, las preguntas y hablar con un alumno le suben el ánimo. Una charla larga sin interacción aburre a los menos atentos.',
      ],
    },
    'class-mood': {
      title: 'El ánimo de la clase',
      intro: 'La barra de arriba muestra cómo se siente la clase en conjunto. El ánimo se contagia: cuando muchos compañeros están aburridos o perdidos, otros se dejan llevar.',
      points: [
        'Tres o más turnos tuyos seguidos sin que hable ningún alumno son un sermón. Los alumnos menos atentos se aburren.',
        'Arregla una clase inquieta haciendo una pregunta, dando la palabra a alguien o poniendo un ejemplo.',
        'Arregla una clase perdida yendo más despacio, volviendo al último punto claro y comprobando con una pregunta.',
      ],
    },
    'notebooks': {
      title: 'Cuadernos',
      intro: 'Haz clic en un alumno de la clase y abre Cuaderno (junto a Hablar, debajo de la casilla de texto). Es todo lo que tendrá para el examen. Un punto en Cuaderno indica que los alumnos han escrito algo nuevo desde la última vez que miraste.',
      points: [
        'Los alumnos toman apuntes con sus propias palabras. Los atentos lo captan casi todo; los demás se pierden algo.',
        'Naranja: un apunte torcido por una idea errónea. No cuenta para los objetivos.',
        'Rojo: una idea errónea que el alumno sigue teniendo. Corrígela con claridad o responderá el examen con ella.',
        'Gris: algo que recuerda de una lección anterior.',
        'Un apunte que empieza con un nombre ("Tom dijo: ...") es de oídas: algo que dijo un compañero y nadie confirmó.',
      ],
    },
    'goals': {
      title: 'Objetivos de la lección',
      intro: 'El contador de objetivos de arriba ("Objetivos 2/5") muestra cuántos objetivos tiene al menos un alumno en sus apuntes. Ábrelo para ver cada objetivo con el número de alumnos que tienen un apunte correcto sobre él.',
      points: [
        'Cada marca verde es un alumno. 0/10 significa que aún no lo has enseñado, o que nadie lo captó.',
        'Cada pregunta del examen evalúa un objetivo. Un objetivo sin apuntes significa que esa pregunta está perdida.',
        'Los apuntes torcidos y los de oídas no cuentan.',
      ],
    },
    'wrong-beliefs': {
      title: 'Ideas erróneas',
      intro: 'Algunos alumnos empiezan la lección creyendo algo falso sobre el tema, como "el signo = significa igual, como en mates". Salen de la propia lección.',
      points: [
        'El portador de ideas erróneas tiene dos, el alumno con dificultades una, y otros dos alumnos una cada uno.',
        'Una idea errónea se mantiene hasta que la corriges con claridad. Los alumnos seguros de sí necesitan que nombres la idea errónea y digas por qué está mal; oír la respuesta correcta no les basta. Además, tuerce los apuntes relacionados.',
        'Los alumnos que aún la tienen al sonar el timbre responden el examen con ella. El boletín los enumera.',
        'Di cuál es la idea errónea y por qué está mal, no solo la idea correcta.',
      ],
    },
    'difficulty': {
      title: 'Fácil, Normal, Difícil, Inspección',
      intro: 'Elige en Ajustes lo difícil que es tu clase. Normal es el juego tal como está pensado.',
      points: [
        'Fácil: los alumnos atienden más y solo el portador de ideas erróneas trae ideas equivocadas.',
        'Difícil: los alumnos atienden menos. Todos menos el entusiasta traen una idea errónea, el portador tres.',
        'Inspección: como Difícil, y una respuesta escrita correcta que no esté respaldada por los apuntes del alumno no puntúa.',
        'Las clases más difíciles cuentan más para tu rango.',
      ],
    },
    'hearsay': {
      title: 'De oídas',
      intro: 'Cuando un alumno dice algo y sigues sin confirmarlo ni corregirlo, algunos compañeros despistados pueden apuntarlo igualmente, como "Nombre dijo: ...".',
      points: [
        'Lo apuntado de oídas no cuenta para los objetivos y, si era falso, puede confundir a los alumnos.',
        'El boletín te avisa cuando ha pasado.',
        'Evítalo reaccionando a cada respuesta: "Sí, exacto" o "No del todo, porque...".',
      ],
    },
    'memory': {
      title: 'Memoria entre lecciones',
      intro: 'Los alumnos recuerdan. Después de un examen, cada alumno guarda hasta ocho apuntes de esa lección, correctos o no, durante sus tres lecciones siguientes.',
      points: [
        'Los apuntes recordados salen en gris en el cuaderno. Los alumnos pueden usarlos para hablar y en los exámenes.',
        'Un alumno que no estuvo en una clase no recuerda nada de ella.',
        'Volver a dar la misma lección empieza de cero, así que repetirla sigue midiendo cómo enseñaste ese día.',
        'Tus errores encontrados en la revisión también se recuerdan. En sus siguientes lecciones, los alumnos que los apuntaron empiezan creyéndolos (en rojo en el cuaderno) hasta que los corrijas, hasta tres por alumno.',
        'En Ajustes está "Hacer que los alumnos olviden las lecciones anteriores".',
      ],
    },
    'voices': {
      title: 'Voces',
      intro: 'Los alumnos leen sus frases en voz alta con las voces de tu navegador, y mueven la boca mientras hablan.',
      points: [
        'Edge tiene las voces más naturales. Chrome y Firefox también funcionan.',
        'Activa o desactiva las voces con "Voces" en el menú ☰ o en Ajustes. El texto siempre se muestra.',
      ],
    },
    'quiz': {
      title: 'El examen',
      intro: 'Cada alumno responde seis preguntas usando solo su cuaderno, sus ideas erróneas y lo que recuerda de lecciones anteriores. La IA no puede usar lo que sabe de la materia.',
      points: [
        'Tipo test: un alumno sin apuntes sobre ese objetivo responde al azar.',
        'Las respuestas escritas se corrigen comparándolas con una respuesta modelo, con el mismo criterio para todos.',
        'Una respuesta escrita correcta que no esté respaldada por los apuntes del alumno saca como mucho la mitad de la nota.',
        'Así que la única forma de subir las notas es enseñar.',
      ],
    },
    'report': {
      title: 'El boletín de notas',
      intro: 'Mientras la clase hace el examen, tú respondes de memoria a tres de sus preguntas. Después ves cómo le ha ido a la clase y por qué, y cómo te ha ido a ti.',
      points: [
        'La media de la clase, los puntos que restan tus errores y la nota de la lección que resulta; y si es tu primera vez, un nuevo récord o tu mejor nota hasta ahora.',
        'Tres consejos: objetivos que nadie tenía, preguntas que fallaron casi todos, ideas erróneas que siguen ahí, manos sin atender.',
        'La tabla de objetivos: cuántos alumnos tenían cada objetivo en sus apuntes, y su media en las preguntas de ese objetivo.',
        '"Tu clase, revisada": todo lo que dijiste o escribiste que era incorrecto.',
        '"Con sus palabras": un alumno te explica la lección.',
        'Abre un alumno para ver cada respuesta, su nota y por qué perdió puntos.',
      ],
    },
    'fact-check': {
      title: 'Tu clase, revisada',
      intro: 'Después del examen, la IA compara todo lo que dijiste y escribiste con la referencia de la lección. Lo que sea falso o engañoso aparece en una lista junto con lo correcto.',
      points: [
        'Así descubres en qué te equivocaste tú: los alumnos apuntan tus errores como si fueran hechos.',
        'Los errores graves salen primero. Cada uno resta puntos a la nota de la lección: grave −5, leve −2, como mucho −15.',
        'Solo se enumeran las afirmaciones incorrectas, no lo que te dejaste.',
        'La revisión la hace una IA y puede equivocarse. Si tienes dudas, búscalo y pulsa "No estoy de acuerdo": ese error deja de restar y la clase lo olvida.',
        'Usa una petición más a la IA por lección.',
      ],
    },
    'explain-back': {
      title: 'Con sus palabras',
      intro: 'Después del examen, un alumno te explica toda la lección usando solo su cuaderno. Muestra lo que tu clase se ha llevado de verdad.',
      points: [
        'El alumno es aquel cuya nota está más cerca de la media de la clase: un alumno típico, no el mejor.',
        'Debajo de la explicación aparecen los objetivos que faltan en los apuntes de ese alumno.',
        'Busca ideas erróneas y lagunas: te dicen qué explicar mejor la próxima vez.',
        'Usa una petición más a la IA por lección.',
      ],
    },
    'review': {
      title: 'Revisar una lección',
      intro: '"Revisar la lección" en el boletín la repasa turno a turno.',
      points: [
        'Un gráfico de los turnos muestra los objetivos cubiertos y el ánimo de la clase, con ✋ donde había manos levantadas. Haz clic en un turno para ir a él.',
        'La conversación está agrupada por turnos, cada uno con el estado de la clase después.',
        'Los errores de la revisión aparecen fijados a la línea en la que los dijiste.',
        'Las marcas "La clase se distrajo" y "+1 objetivo" muestran dónde algo fue mal o bien.',
      ],
    },
    'follow-up': {
      title: 'Clases de repaso',
      intro: 'Cuando la clase falló objetivos o la revisión encontró errores, el boletín ofrece "Dar una clase de repaso".',
      points: [
        'Un objetivo se falla cuando nadie lo tenía en sus apuntes, o la clase sacó menos del 50% en sus preguntas.',
        'Vuelven los mismos diez alumnos. La lección cubre solo los objetivos fallados y sus preguntas.',
        'Los alumnos empiezan creyendo tus errores y las ideas erróneas que aún tenían.',
        'Su nota no cuenta para el curso.',
      ],
    },
    'scores': {
      title: 'Notas y cursos',
      intro: 'Cada lección terminada guarda su nota: la media de la clase menos los puntos de tus errores. Vuelve a dar una lección para superar tu mejor nota. Los objetivos que fallaste tú, o que ningún alumno tenía en sus apuntes, vuelven para repasar en la pantalla de lecciones tras 1, 3 y 7 días.',
      points: [
        'Cada lección muestra su mejor nota, su última nota y cuántas veces la has dado.',
        'La nota de un curso es la media de las mejores notas de las lecciones dadas hasta ahora ("Nota del curso 70% · 2 de 5 dadas").',
        'Las notas se quedan en este navegador. No se incluyen al exportar lecciones.',
      ],
    },
    'challenges': {
      title: 'Retos de lección',
      intro: 'Cada lección tiene un reto de enseñanza, que aparece en la barra de arriba con 🎯.',
      points: [
        'Por ejemplo: usar un ejemplo de la vida real, conseguir que responda el alumno callado, no soltar nunca tres turnos seguidos de sermón.',
        'Algunos los comprueba el juego y otros la IA después del examen.',
        'El boletín dice si lo has superado.',
      ],
    },
    'rank': {
      title: 'Rango e insignias',
      intro: 'Tu rango sube de Profesor en prácticas a Profesor suplente, Profesor, Profesor titular y Jefe de departamento a medida que das más lecciones con mejores notas.',
      points: [
        'Las clases más difíciles cuentan más. Cada lección cuenta por la media de sus tres últimas partidas, y las lecciones de repaso no cuentan.',
        'Las insignias marcan hitos: una primera clase con un 80%, un curso completo, retos superados, una lección sin errores encontrados.',
        'Ambos aparecen en el menú principal y en el boletín.',
        '"Compartir" en el boletín crea una imagen de tu boletín de notas.',
      ],
    },
    'courses': {
      title: 'Cursos incluidos',
      intro: 'El juego trae tres cursos para enseñar, cada uno con objetivos, ideas erróneas habituales y un examen que evalúa la comprensión.',
      points: [
        'Introducción a Python: variables, decisiones con if, bucles.',
        'Estructuras de datos: listas enlazadas, pilas, colas, árboles binarios.',
        'SQL básico: SELECT y WHERE, unir tablas, contar y agrupar.',
        'Elige una lección que aún no conozcas bien: enseñarla es como la aprendes.',
      ],
    },
    'pdf': {
      title: 'Crear lecciones desde PDF',
      intro: 'Convierte tus propios apuntes, diapositivas o capítulos de libro en lecciones. La IA escribe los objetivos, las ideas erróneas y el examen.',
      points: [
        'En la pantalla de lecciones, elige uno o varios PDF (mantén pulsado Ctrl).',
        'Por capítulos: la IA busca dónde empieza cada capítulo. O divídelo en varias partes iguales.',
        'Una lección admite hasta 30.000 caracteres. Los PDF escaneados (imágenes de páginas) no funcionan.',
        'El PDF se queda en tu ordenador; su texto se envía a tu proveedor de IA.',
      ],
    },
    'editing': {
      title: 'Editar una lección',
      intro: 'Revisa cada examen generado antes de darlo. Pulsa Editar junto a una lección.',
      points: [
        'Se puede cambiar todo: el título, los objetivos, las ideas erróneas y, para cada pregunta, su tipo, objetivo, enunciado, opciones, respuesta correcta y puntuación.',
        'Añade o quita preguntas.',
        'Hazlo tan exigente como quieras: luego tendrás que enseñar lo bastante bien para que aprueben.',
        'A veces la IA pregunta algo que el capítulo no cubre. Corrige o quita esas preguntas.',
      ],
    },
    'sharing': {
      title: 'Compartir lecciones',
      intro: 'Las lecciones y los cursos son archivos que puedes pasar a otros.',
      points: [
        '"Exportar" guarda una lección, "Exportar curso" un curso entero y "Exportar todas mis lecciones" todo lo que has creado.',
        '"Añadir un archivo de lección o curso" lee cualquiera de ellos. Cada lección se comprueba antes de añadirla.',
        'Los archivos llevan lecciones y exámenes, no notas.',
      ],
    },
    'providers': {
      title: 'Elegir una IA',
      intro: 'Los alumnos los interpreta un modelo de IA que eliges en Ajustes. Varios funcionan gratis.',
      points: [
        'Pega la clave en Ajustes, deja el modelo vacío y pulsa "Probar la conexión". El juego elige un modelo adecuado.',
        'Tu clave solo se guarda en este navegador. No la pegues en ningún otro sitio.',
        'También puedes usar un modelo en tu propio ordenador (Ollama, LM Studio, llama.cpp). Mira el README.',
      ],
    },
    'limits': {
      title: 'Límites gratuitos',
      intro: 'Los planes de IA gratis limitan cuánto puedes pedir por minuto o por día. Una lección usa entre 40 y 50 peticiones, más dos después del examen para la revisión y la explicación.',
      points: [
        '"Peticiones a la IA hoy" en el menú ☰ cuenta lo que ha enviado este navegador.',
        'Cuando se llega a un límite, el juego espera un momento y vuelve a intentarlo, o cambia de modelo él solo.',
        'Con un límite diario puesto en Ajustes, el timbre suena antes para que el examen siempre tenga peticiones suficientes.',
      ],
    },
    'errors': {
      title: 'Cuando algo falla',
      intro: 'Si la IA no puede responder, aparece un mensaje en rojo con un botón "Reintentar". No se pierde nada: se vuelve a enviar el mismo turno.',
      points: [
        '"No se pudo conectar con la dirección de la IA": revisa la dirección, o que tu modelo local esté en marcha.',
        '"Ha rechazado la clave": la clave es incorrecta o se ha borrado.',
        '"Demasiadas peticiones" o "saturado": espera un minuto.',
        '"Un formato que el juego no entiende": elige un modelo más potente.',
        'Una lección en curso se guarda después de cada turno, aunque se cierre la página.',
      ],
    },
    'realistic': {
      title: 'Modo realista',
      intro: 'Marca "Modo realista" en el menú ☰ para ocultar los cuadernos y los contadores de objetivos. Como un profesor de verdad, solo sabes lo que han entendido los alumnos si les preguntas.',
      points: [
        'Desactívalo cuando quieras para volver a mirar.',
      ],
    },
  },
};
