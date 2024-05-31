import { AppProps } from 'next/app';
import { CssBaseline } from '@mui/material';

const MyApp = ({ Component, pageProps }: AppProps) => {
  return (
    <>
      <CssBaseline />
      <Component {...pageProps} />
    </>
  );
};

export default MyApp;
