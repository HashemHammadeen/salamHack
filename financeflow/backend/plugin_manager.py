import os
import yaml
import importlib.util
from fastapi import APIRouter

class PluginManager:
    def __init__(self):
        self.plugins_dir = os.path.join(os.path.dirname(__file__), 'plugins')
        self.disabled_plugins_dir = os.path.join(os.path.dirname(__file__), 'disabled_plugins')
        self.installed_plugins = []
        self.routers = []

    def discover_plugins(self):
        self.installed_plugins = []
        self.routers = []
        
        if not os.path.exists(self.plugins_dir):
            return

        for plugin_name in os.listdir(self.plugins_dir):
            plugin_path = os.path.join(self.plugins_dir, plugin_name)
            if os.path.isdir(plugin_path):
                manifest_path = os.path.join(plugin_path, 'manifest.yaml')
                if os.path.exists(manifest_path):
                    with open(manifest_path, 'r') as f:
                        manifest = yaml.safe_load(f)
                    
                    # Load plugin logic
                    logic_path = os.path.join(plugin_path, 'logic.py')
                    if os.path.exists(logic_path):
                        spec = importlib.util.spec_from_file_location(f"plugins.{plugin_name}.logic", logic_path)
                        module = importlib.util.module_from_spec(spec)
                        spec.loader.exec_module(module)
                        
                        if hasattr(module, 'router'):
                            self.routers.append(module.router)
                            
                    self.installed_plugins.append({
                        "id": plugin_name,
                        "name": manifest.get('name', plugin_name),
                        "description": manifest.get('description', ''),
                        "version": manifest.get('version', '1.0.0')
                    })

    def register_routes(self, app):
        for router in self.routers:
            app.include_router(router, prefix="/api/plugins")

    def get_installed_plugins(self):
        # Dynamically read for the UI
        installed = []
        if not os.path.exists(self.plugins_dir):
            return installed
            
        for plugin_name in os.listdir(self.plugins_dir):
            plugin_path = os.path.join(self.plugins_dir, plugin_name)
            if os.path.isdir(plugin_path):
                manifest_path = os.path.join(plugin_path, 'manifest.yaml')
                if os.path.exists(manifest_path):
                    with open(manifest_path, 'r') as f:
                        manifest = yaml.safe_load(f)
                    installed.append({
                        "id": plugin_name,
                        "name": manifest.get('name', plugin_name),
                        "description": manifest.get('description', ''),
                        "version": manifest.get('version', '1.0.0')
                    })
        return installed

    def get_available_plugins(self):
        available = []
        if not os.path.exists(self.disabled_plugins_dir):
            return available
            
        for plugin_name in os.listdir(self.disabled_plugins_dir):
            plugin_path = os.path.join(self.disabled_plugins_dir, plugin_name)
            if os.path.isdir(plugin_path):
                manifest_path = os.path.join(plugin_path, 'manifest.yaml')
                if os.path.exists(manifest_path):
                    with open(manifest_path, 'r') as f:
                        manifest = yaml.safe_load(f)
                    available.append({
                        "id": plugin_name,
                        "name": manifest.get('name', plugin_name),
                        "description": manifest.get('description', ''),
                        "version": manifest.get('version', '1.0.0')
                    })
        return available
