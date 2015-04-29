# opclean

## utility for cleaning shrejs oplogs

## Instalation

```bash
npm install -g opclean
```

## Usage

```bash
Usage: opclean -u [url] -d [num] -e [collections list]

Options:
  -u, --url       mongodb url                                         [required]
  -d, --days      amount of days to preserve records                [default: 7]
  -e, --excludes  collections to exclude                  [default: "auths_ops"]

Examples:
  opclean -u mongodb://localhost:27017/idg -d 3     clean all 3-days old records 
                                                    from all ops-collections (ex
                                                    cept 'auths_ops') and except 
                                                    last op for all snapshots
```          
                                  