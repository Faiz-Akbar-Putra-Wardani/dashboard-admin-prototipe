import { ref } from 'vue';
import { formatRupiah, parseRupiah } from '@/utils/currencyFormatter';

export function useCurrencyInput(initialValue = "") {
  const displayValue = ref(formatRupiah(initialValue));
  const rawValue = ref(parseRupiah(initialValue));
  const handleInput = (event) => {
    const inputValue = event.target.value;
    const parsed = parseRupiah(inputValue);
    
    displayValue.value = formatRupiah(parsed);
    rawValue.value = parsed;
  };

  const setValue = (value) => {
    const parsed = parseRupiah(value.toString());
    displayValue.value = formatRupiah(parsed);
    rawValue.value = parsed;
  };

  const reset = () => {
    displayValue.value = "";
    rawValue.value = "";
  };

  return {
    displayValue,
    rawValue,
    handleInput,
    setValue,
    reset
  };
}
