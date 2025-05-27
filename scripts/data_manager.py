#!/usr/bin/env python3
"""
Edunari - Gestor de Datos con CSV + Pandas
Módulo para cargar y manejar datos desde archivos CSV
"""

import os
import pandas as pd
from typing import List, Dict, Any, Optional


class EdunariDataManager:
    """
    Gestor de datos para Edunari usando CSV + Pandas
    
    Ventajas de usar CSV + Pandas:
    - Fácil de editar y mantener
    - Excelente rendimiento para búsquedas
    - Escalable hasta miles de registros
    - Compatible con Excel y Google Sheets
    - Ideal para proyectos estudiantiles
    """
    
    def __init__(self, data_dir: str = "data"):
        """
        Inicializar el gestor de datos
        
        Args:
            data_dir: Directorio donde están los archivos CSV
        """
        self.data_dir = data_dir
        self.emprendimientos_df = None
        self.productos_df = None
        self.servicios_df = None
        self._load_data()
    
    def _load_data(self):
        """Cargar todos los archivos CSV"""
        try:
            # Cargar emprendimientos
            emprendimientos_path = os.path.join(self.data_dir, 'emprendimientos.csv')
            if os.path.exists(emprendimientos_path):
                self.emprendimientos_df = pd.read_csv(emprendimientos_path)
                print(f"✅ Cargados {len(self.emprendimientos_df)} emprendimientos")
            
            # Cargar productos
            productos_path = os.path.join(self.data_dir, 'productos.csv')
            if os.path.exists(productos_path):
                self.productos_df = pd.read_csv(productos_path)
                # Procesar tags (convertir string a lista)
                self.productos_df['tags_list'] = self.productos_df['tags'].apply(
                    lambda x: [tag.strip() for tag in x.split(',')] if pd.notna(x) else []
                )
                print(f"✅ Cargados {len(self.productos_df)} productos")
            
            # Cargar servicios
            servicios_path = os.path.join(self.data_dir, 'servicios.csv')
            if os.path.exists(servicios_path):
                self.servicios_df = pd.read_csv(servicios_path)
                # Procesar tags (convertir string a lista)
                self.servicios_df['tags_list'] = self.servicios_df['tags'].apply(
                    lambda x: [tag.strip() for tag in x.split(',')] if pd.notna(x) else []
                )
                print(f"✅ Cargados {len(self.servicios_df)} servicios")
                
        except Exception as e:
            print(f"❌ Error cargando datos: {e}")
            # Crear DataFrames vacíos como fallback
            self.emprendimientos_df = pd.DataFrame()
            self.productos_df = pd.DataFrame()
            self.servicios_df = pd.DataFrame()
    
    def search(self, query: str, limit: int = 50) -> List[Dict[str, Any]]:
        """
        Buscar productos y servicios
        
        Args:
            query: Término de búsqueda
            limit: Máximo número de resultados
            
        Returns:
            Lista de resultados encontrados
        """
        results = []
        query_lower = query.lower()
        
        # Buscar en productos
        if self.productos_df is not None and not self.productos_df.empty:
            productos_results = self._search_productos(query_lower)
            results.extend(productos_results)
        
        # Buscar en servicios
        if self.servicios_df is not None and not self.servicios_df.empty:
            servicios_results = self._search_servicios(query_lower)
            results.extend(servicios_results)
        
        # Ordenar por relevancia y limitar resultados
        results = sorted(results, key=lambda x: x.get('relevance_score', 0), reverse=True)
        return results[:limit]
    
    def _search_productos(self, query: str) -> List[Dict[str, Any]]:
        """Buscar en productos usando pandas"""
        results = []
        
        # Crear máscara de búsqueda
        mask = (
            self.productos_df['nombre'].str.lower().str.contains(query, na=False) |
            self.productos_df['descripcion'].str.lower().str.contains(query, na=False) |
            self.productos_df['tags'].str.lower().str.contains(query, na=False)
        )
        
        # Obtener productos que coinciden
        matching_productos = self.productos_df[mask]
        
        for _, producto in matching_productos.iterrows():
            # Obtener información del emprendimiento
            emprendimiento = self._get_emprendimiento_info(producto['emprendimiento_id'])
            
            if emprendimiento is not None:
                # Calcular score de relevancia
                relevance_score = self._calculate_relevance(query, producto, emprendimiento)
                
                result = {
                    'id': int(producto['id']),
                    'nombre': producto['nombre'],
                    'descripcion': producto['descripcion'],
                    'precio': int(producto['precio']),
                    'disponible': bool(producto['disponible']),
                    'stock': int(producto['stock']) if pd.notna(producto['stock']) else 0,
                    'tags': producto['tags_list'],
                    'tipo': 'producto',
                    'categoria': emprendimiento['categoria'],
                    'emprendimiento': emprendimiento['nombre'],
                    'emprendedor': emprendimiento['emprendedor_nombre'],
                    'instagram': emprendimiento['emprendedor_instagram'],
                    'relevance_score': relevance_score
                }
                results.append(result)
        
        return results
    
    def _search_servicios(self, query: str) -> List[Dict[str, Any]]:
        """Buscar en servicios usando pandas"""
        results = []
        
        # Crear máscara de búsqueda
        mask = (
            self.servicios_df['nombre'].str.lower().str.contains(query, na=False) |
            self.servicios_df['descripcion'].str.lower().str.contains(query, na=False) |
            self.servicios_df['tags'].str.lower().str.contains(query, na=False)
        )
        
        # Obtener servicios que coinciden
        matching_servicios = self.servicios_df[mask]
        
        for _, servicio in matching_servicios.iterrows():
            # Obtener información del emprendimiento
            emprendimiento = self._get_emprendimiento_info(servicio['emprendimiento_id'])
            
            if emprendimiento is not None:
                # Calcular score de relevancia
                relevance_score = self._calculate_relevance(query, servicio, emprendimiento)
                
                result = {
                    'id': int(servicio['id']),
                    'nombre': servicio['nombre'],
                    'descripcion': servicio['descripcion'],
                    'precio': int(servicio['precio']),
                    'disponible': bool(servicio['disponible']),
                    'duracion': servicio['duracion'] if pd.notna(servicio['duracion']) else '',
                    'tags': servicio['tags_list'],
                    'tipo': 'servicio',
                    'categoria': emprendimiento['categoria'],
                    'emprendimiento': emprendimiento['nombre'],
                    'emprendedor': emprendimiento['emprendedor_nombre'],
                    'instagram': emprendimiento['emprendedor_instagram'],
                    'relevance_score': relevance_score
                }
                results.append(result)
        
        return results
    
    def _get_emprendimiento_info(self, emprendimiento_id: int) -> Optional[Dict[str, Any]]:
        """Obtener información de un emprendimiento por ID"""
        if self.emprendimientos_df is None or self.emprendimientos_df.empty:
            return None
        
        emprendimiento_row = self.emprendimientos_df[
            self.emprendimientos_df['id'] == emprendimiento_id
        ]
        
        if emprendimiento_row.empty:
            return None
        
        return emprendimiento_row.iloc[0].to_dict()
    
    def _calculate_relevance(self, query: str, item: pd.Series, emprendimiento: Dict[str, Any]) -> float:
        """
        Calcular score de relevancia para un item
        
        Factores de relevancia:
        - Coincidencia exacta en nombre: +3 puntos
        - Coincidencia en tags: +2 puntos por tag
        - Coincidencia en descripción: +1 punto
        - Coincidencia en emprendimiento/emprendedor: +1 punto
        """
        score = 0.0
        
        # Coincidencia exacta en nombre
        if query in item['nombre'].lower():
            score += 3.0
        
        # Coincidencias en tags
        for tag in item['tags_list']:
            if query in tag.lower():
                score += 2.0
        
        # Coincidencia en descripción
        if query in item['descripcion'].lower():
            score += 1.0
        
        # Coincidencia en emprendimiento o emprendedor
        if (query in emprendimiento['nombre'].lower() or 
            query in emprendimiento['emprendedor_nombre'].lower()):
            score += 1.0
        
        return score
    
    def get_statistics(self) -> Dict[str, Any]:
        """Obtener estadísticas del sistema"""
        stats = {
            'total_emprendimientos': 0,
            'total_productos': 0,
            'total_servicios': 0,
            'total_items': 0,
            'categorias_productos': [],
            'categorias_servicios': []
        }
        
        if self.emprendimientos_df is not None and not self.emprendimientos_df.empty:
            stats['total_emprendimientos'] = len(self.emprendimientos_df)
            
            # Categorías de productos
            productos_emp = self.emprendimientos_df[
                self.emprendimientos_df['tipo'] == 'producto'
            ]
            stats['categorias_productos'] = productos_emp['categoria'].unique().tolist()
            
            # Categorías de servicios
            servicios_emp = self.emprendimientos_df[
                self.emprendimientos_df['tipo'] == 'servicio'
            ]
            stats['categorias_servicios'] = servicios_emp['categoria'].unique().tolist()
        
        if self.productos_df is not None and not self.productos_df.empty:
            stats['total_productos'] = len(self.productos_df)
        
        if self.servicios_df is not None and not self.servicios_df.empty:
            stats['total_servicios'] = len(self.servicios_df)
        
        stats['total_items'] = stats['total_productos'] + stats['total_servicios']
        
        return stats
    
    def get_emprendimientos(self) -> List[Dict[str, Any]]:
        """Obtener lista de todos los emprendimientos"""
        if self.emprendimientos_df is None or self.emprendimientos_df.empty:
            return []
        
        return self.emprendimientos_df.to_dict('records')
    
    def get_productos_by_category(self, categoria: str, limit: int = 50) -> List[Dict[str, Any]]:
        """Obtener productos por categoría"""
        if self.productos_df is None or self.productos_df.empty:
            return []
        
        # Filtrar emprendimientos por categoría
        emprendimientos_categoria = self.emprendimientos_df[
            (self.emprendimientos_df['categoria'] == categoria) & 
            (self.emprendimientos_df['tipo'] == 'producto')
        ]['id'].tolist()
        
        # Filtrar productos
        productos_categoria = self.productos_df[
            self.productos_df['emprendimiento_id'].isin(emprendimientos_categoria)
        ].head(limit)
        
        results = []
        for _, producto in productos_categoria.iterrows():
            emprendimiento = self._get_emprendimiento_info(producto['emprendimiento_id'])
            if emprendimiento:
                result = {
                    'id': int(producto['id']),
                    'nombre': producto['nombre'],
                    'descripcion': producto['descripcion'],
                    'precio': int(producto['precio']),
                    'disponible': bool(producto['disponible']),
                    'stock': int(producto['stock']) if pd.notna(producto['stock']) else 0,
                    'tags': producto['tags_list'],
                    'tipo': 'producto',
                    'categoria': emprendimiento['categoria'],
                    'emprendimiento': emprendimiento['nombre'],
                    'emprendedor': emprendimiento['emprendedor_nombre'],
                    'instagram': emprendimiento['emprendedor_instagram']
                }
                results.append(result)
        
        return results
    
    def get_servicios_by_category(self, categoria: str, limit: int = 50) -> List[Dict[str, Any]]:
        """Obtener servicios por categoría"""
        if self.servicios_df is None or self.servicios_df.empty:
            return []
        
        # Filtrar emprendimientos por categoría
        emprendimientos_categoria = self.emprendimientos_df[
            (self.emprendimientos_df['categoria'] == categoria) & 
            (self.emprendimientos_df['tipo'] == 'servicio')
        ]['id'].tolist()
        
        # Filtrar servicios
        servicios_categoria = self.servicios_df[
            self.servicios_df['emprendimiento_id'].isin(emprendimientos_categoria)
        ].head(limit)
        
        results = []
        for _, servicio in servicios_categoria.iterrows():
            emprendimiento = self._get_emprendimiento_info(servicio['emprendimiento_id'])
            if emprendimiento:
                result = {
                    'id': int(servicio['id']),
                    'nombre': servicio['nombre'],
                    'descripcion': servicio['descripcion'],
                    'precio': int(servicio['precio']),
                    'disponible': bool(servicio['disponible']),
                    'duracion': servicio['duracion'] if pd.notna(servicio['duracion']) else '',
                    'tags': servicio['tags_list'],
                    'tipo': 'servicio',
                    'categoria': emprendimiento['categoria'],
                    'emprendimiento': emprendimiento['nombre'],
                    'emprendedor': emprendimiento['emprendedor_nombre'],
                    'instagram': emprendimiento['emprendedor_instagram']
                }
                results.append(result)
        
        return results


# Instancia global del gestor de datos
data_manager = None

def get_data_manager() -> EdunariDataManager:
    """Obtener instancia del gestor de datos (singleton)"""
    global data_manager
    if data_manager is None:
        data_manager = EdunariDataManager()
    return data_manager 