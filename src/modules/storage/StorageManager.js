/**
 * StorageManager - Gestiona el almacenamiento en localStorage
 */

const StorageManager = {
  /**
   * Guarda datos en localStorage
   * @param {string} key - Clave de almacenamiento
   * @param {any} data - Datos a guardar
   * @returns {boolean} - true si se guardó exitosamente
   */
  save(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
      return true;
    } catch (error) {
      console.error('Error guardando en localStorage:', error);
      return false;
    }
  },

  /**
   * Carga datos desde localStorage
   * @param {string} key - Clave de almacenamiento
   * @param {any} defaultValue - Valor por defecto si no existe
   * @returns {any} - Datos cargados o valor por defecto
   */
  load(key, defaultValue) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error('Error cargando desde localStorage:', error);
      return defaultValue;
    }
  },

  /**
   * Elimina un item de localStorage
   * @param {string} key - Clave a eliminar
   */
  remove(key) {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Error eliminando de localStorage:', error);
    }
  },

  /**
   * Limpia todo el localStorage
   */
  clear() {
    try {
      localStorage.clear();
    } catch (error) {
      console.error('Error limpiando localStorage:', error);
    }
  }
};

export default StorageManager;
