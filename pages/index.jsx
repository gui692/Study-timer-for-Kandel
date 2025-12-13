import Head from 'next/head';
import StudyTimer from '../components/StudyTimer';

export default function HomePage() {
  return (
    <>
      <Head>
        <title>Study Timer | 3-Pass Method</title>
        <meta
          name="description"
          content="Focus timer following the 3-Pass Method with guided phases and visual progress."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <StudyTimer />
    </>
  );
}
