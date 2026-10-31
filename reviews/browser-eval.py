"""Send a local QA expression through Orca's documented browser eval command."""
import pathlib
import subprocess
import sys

subprocess.run(['orca', 'eval', '--page', sys.argv[1], '--expression', pathlib.Path(sys.argv[2]).read_text(encoding='utf-8'), '--json'], check=True)
