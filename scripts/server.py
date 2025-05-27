#!/usr/bin/env python3
"""
Edunari - Servidor de Desarrollo con CSV + Pandas
Servidor HTTP para la plataforma Edunari usando datos CSV
"""

import os
import sys
import json
import webbrowser
from http.server import HTTPServer, SimpleHTTPRequestHandler
from urllib.parse import urlparse, parse_qs

# Agregar el directorio actual al path para importar data_manager
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

try:
    from scripts.data_manager import get_data_manager
    PANDAS_AVAILABLE = True
except ImportError as e:
    print(f"❌ Error importando pandas: {e}")
    print("💡 Instala pandas con: pip install pandas")
    PANDAS_AVAILABLE = False


class EdunariHandler(SimpleHTTPRequestHandler):
    """
    Manejador HTTP para Edunari con soporte CSV + Pandas
    
    Endpoints API:
    - /api/status - Estadísticas del sistema
    - /api/search?q=term - Búsqueda general
    - /api/entrepreneurs - Lista de emprendimientos
    - /api/products?category=cat - Productos por categoría
    - /api/services?category=cat - Servicios por categoría
    """
    
    def __init__(self, *args, **kwargs):
        self.data_manager = None
        super().__init__(*args, **kwargs)
    
    def do_GET(self):
        """Manejar peticiones GET"""
        parsed_url = urlparse(self.path)
        path = parsed_url.path
        query_params = parse_qs(parsed_url.query)
        
        # Endpoints de la API
        if path.startswith('/api/'):
            self._handle_api_request(path, query_params)
        else:
            # Servir archivos estáticos
            super().do_GET()
    
    def _handle_api_request(self, path: str, params: dict):
        """Manejar peticiones a la API"""
        if not PANDAS_AVAILABLE:
            self._send_error_response(500, "Pandas no está disponible")
            return
        
        try:
            # Inicializar data manager si es necesario
            if self.data_manager is None:
                self.data_manager = get_data_manager()
            
            if path == '/api/status':
                self._handle_status()
            elif path == '/api/search':
                self._handle_search(params)
            elif path == '/api/entrepreneurs':
                self._handle_entrepreneurs()
            elif path == '/api/products':
                self._handle_products(params)
            elif path == '/api/services':
                self._handle_services(params)
            else:
                self._send_error_response(404, "Endpoint no encontrado")
                
        except Exception as e:
            print(f"❌ Error en API: {e}")
            self._send_error_response(500, f"Error interno: {str(e)}")
    
    def _handle_status(self):
        """Manejar /api/status"""
        try:
            stats = self.data_manager.get_statistics()
            self._send_json_response(stats)
        except Exception as e:
            print(f"❌ Error obteniendo estadísticas: {e}")
            self._send_error_response(500, "Error obteniendo estadísticas")
    
    def _handle_search(self, params: dict):
        """Manejar /api/search"""
        query = params.get('q', [''])[0].strip()
        
        if not query:
            self._send_json_response([])
            return
        
        try:
            results = self.data_manager.search(query)
            print(f"🔍 Búsqueda: '{query}' - {len(results)} resultados")
            self._send_json_response(results)
        except Exception as e:
            print(f"❌ Error en búsqueda: {e}")
            self._send_error_response(500, "Error en búsqueda")
    
    def _handle_entrepreneurs(self):
        """Manejar /api/entrepreneurs"""
        try:
            emprendimientos = self.data_manager.get_emprendimientos()
            self._send_json_response(emprendimientos)
        except Exception as e:
            print(f"❌ Error obteniendo emprendimientos: {e}")
            self._send_error_response(500, "Error obteniendo emprendimientos")
    
    def _handle_products(self, params: dict):
        """Manejar /api/products"""
        categoria = params.get('category', [''])[0].strip()
        limit = int(params.get('limit', ['50'])[0])
        
        try:
            if categoria:
                productos = self.data_manager.get_productos_by_category(categoria, limit)
            else:
                # Si no hay categoría, devolver productos vacíos
                productos = []
            
            self._send_json_response(productos)
        except Exception as e:
            print(f"❌ Error obteniendo productos: {e}")
            self._send_error_response(500, "Error obteniendo productos")
    
    def _handle_services(self, params: dict):
        """Manejar /api/services"""
        categoria = params.get('category', [''])[0].strip()
        limit = int(params.get('limit', ['50'])[0])
        
        try:
            if categoria:
                servicios = self.data_manager.get_servicios_by_category(categoria, limit)
            else:
                # Si no hay categoría, devolver servicios vacíos
                servicios = []
            
            self._send_json_response(servicios)
        except Exception as e:
            print(f"❌ Error obteniendo servicios: {e}")
            self._send_error_response(500, "Error obteniendo servicios")
    
    def _send_json_response(self, data):
        """Enviar respuesta JSON"""
        self.send_response(200)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
        
        json_data = json.dumps(data, ensure_ascii=False, indent=2)
        self.wfile.write(json_data.encode('utf-8'))
    
    def _send_error_response(self, code: int, message: str):
        """Enviar respuesta de error"""
        self.send_response(code)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        
        error_data = {'error': message, 'code': code}
        json_data = json.dumps(error_data, ensure_ascii=False)
        self.wfile.write(json_data.encode('utf-8'))
    
    def log_message(self, format, *args):
        """Log personalizado"""
        message = format % args
        print(f"[{self.log_date_time_string()}] {message}")


def main():
    """Función principal del servidor"""
    # Configuración
    HOST = 'localhost'
    PORT = 8000
    
    # Verificar que estamos en el directorio correcto
    if not os.path.exists('index.html'):
        print("❌ Error: No se encuentra index.html")
        print("💡 Ejecuta el servidor desde el directorio raíz del proyecto")
        return
    
    # Verificar que existe el directorio data
    if not os.path.exists('data'):
        print("❌ Error: No se encuentra el directorio 'data'")
        print("💡 Asegúrate de que existan los archivos CSV en el directorio 'data'")
        return
    
    # Verificar pandas
    if not PANDAS_AVAILABLE:
        print("❌ Error: Pandas no está disponible")
        print("💡 Instala pandas con: pip install pandas")
        return
    
    print("=" * 50)
    print("🎓 EDUNARI - Servidor con CSV + Pandas")
    print("=" * 50)
    print(f"Servidor: http://{HOST}:{PORT}")
    print(f"API Search: http://{HOST}:{PORT}/api/search?q=chocolate")
    print(f"API Status: http://{HOST}:{PORT}/api/status")
    print("=" * 50)
    
    try:
        # Crear servidor
        server = HTTPServer((HOST, PORT), EdunariHandler)
        
        # Abrir navegador
        print("🌐 Abriendo navegador...")
        webbrowser.open(f'http://{HOST}:{PORT}')
        
        print("✅ Servidor iniciado - Presiona Ctrl+C para detener")
        
        # Iniciar servidor
        server.serve_forever()
        
    except KeyboardInterrupt:
        print("\n🛑 Deteniendo servidor...")
        server.shutdown()
        print("✅ Servidor detenido")
    except Exception as e:
        print(f"❌ Error iniciando servidor: {e}")


if __name__ == '__main__':
    main() 