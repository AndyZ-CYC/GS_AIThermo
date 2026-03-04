import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MatrixOverview } from './components/MatrixOverview';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <MatrixOverview />
    </QueryClientProvider>
  );
}

export default App;
