import { ref, computed } from 'vue'
export function useFilter(itemsRef) {
  const searchQuery = ref('')
  const selectedBrand = ref('Semua')

  const filteredItems = computed(() => {
    const items = Array.isArray(itemsRef.value) ? itemsRef.value : []
    
    return items.filter(item => {
      const matchSearch = item.name
        .toLowerCase()
        .includes(searchQuery.value.toLowerCase())
      
      const matchBrand = 
        selectedBrand.value === 'Semua' || 
        item.brand === selectedBrand.value
      
      return matchSearch && matchBrand
    })
  })

  const resetFilters = () => {
    searchQuery.value = ''
    selectedBrand.value = 'Semua'
  }

  return {
    searchQuery,
    selectedBrand,
    filteredItems,
    resetFilters,
  }
}
