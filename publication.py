

# %%
import re
import bibtexparser
import pandas as pd
import yaml


# Create the publication list for format coming from co-authors list


def make_link_author_website(author, emphasize="J. Salmon"):
    names_url = pd.read_csv("data/coauthors_url.csv", header="infer")
    url = names_url.loc[names_url.name == author, "url"].values[0]
    return author if author == emphasize else f'<a href="{url}">{author}</a>'



def make_nice_author(author, emphasize="J. Salmon"):
    split_author = author.split(" and ")
    insert_pos = len(split_author) - 1
    names_split = [au.split(", ") for au in split_author]
    names = ["{} {}".format(n[1], n[0]) for n in names_split]
    names_url = [make_link_author_website(n) for n in names]
    if len(split_author) > 1:
        author_edit = (
            ", ".join(names_url[:insert_pos]) + " and " + names_url[insert_pos]
        )
    else:
        author_edit = names_url[insert_pos]
    if emphasize:
        author_edit = author_edit.replace(
            emphasize, "<strong>" + emphasize + "</strong>"
        )
    return author_edit


def make_nice_title(title):
    return title.replace("{", "").replace("}", "")


""" XXX
- make sure not to use unicode or LaTeX code
- only full author records, in "surname, name and" format
"""


def get_bib_entries(bib_fname):
    with open(bib_fname) as bib:
        bib_str = bib.read()

    parser = bibtexparser.bparser.BibTexParser(common_strings=True)
    records = parser.parse(bib_str)
    parser2 = bibtexparser.bparser.BibTexParser(common_strings=True)
    one_records = parser2.parse(bib_str)

    entries = []

    for k, item in enumerate(records.entries):
        one_records.entries = records.entries[k : k + 1]
        item["author"] = make_nice_author(item["author"])
        for key in ["annote", "owner", "group", "topic"]:
            if key in item:
                del item[key]

        bibtex_str = bibtexparser.dumps(one_records).strip()

        regex = r"author = {[^}]*}"
        matches = list(re.finditer(regex, bibtex_str, re.MULTILINE))
        assert len(matches) == 1
        match = matches[0]
        start, stop = match.start(), match.end()
        author_str = bibtex_str[start:stop]
        author_str_ok = ""
        splits = author_str.split(", ")
        for k, s in enumerate(splits):
            # if ((k % 2 == 0) and k < (len(splits) - 2)):
            if k > 0:
                author_str_ok += " and "
            # else:
            # author_str_ok += ', '
            author_str_ok += s

        bibtex_str_ok = bibtex_str[:start] + author_str_ok + bibtex_str[stop:]
        item["bibtex"] = bibtex_str_ok
        # Search for the pattern in the text
        pattern = r'<a href="(.*?)">'
        if "comment" in item:
            item["code"] = re.search(pattern, item["comment"])
        item["title"] = make_nice_title(item["title"])
        item["index"] = k
        if "url" in item:
            item["link"] = item["url"]
        entries.append(item)
    return entries


entries = get_bib_entries("data/Salmon.bib")
entries.sort(key=lambda record: record["year"], reverse=True)
PUBLICATION_LIST = entries[:]
PUBLICATION_LIST_SHORT = PUBLICATION_LIST[:10]

for i, pub in enumerate(PUBLICATION_LIST_SHORT):
    print(PUBLICATION_LIST_SHORT[i])

# Transform list into yaml file


def transform_to_yaml(entry):
    # Extract and format the author information
    # authors = []
    # for author in entry['author'].split(' and '):
    #     name_parts = author.split(', ')
    #     print(name_parts)
    #     if len(name_parts) == 2:
    #         family, given = name_parts
    #         authors.append(given + ' ' + family)
    # Create the YAML structure
    yaml_entry = {
        'abstract': entry.get('abstract', ''),
        'accessed': entry.get('accessed', ''),
        'author': entry.get('author', ''),
        'container-title': entry.get('journal', entry.get('booktitle', '')),
        'doi': entry.get('doi', ''),
        'id': entry.get('ID', ''),
        'issn': entry.get('issn', ''),
        'issue': entry.get('issue', ''),
        'issued': entry.get('issued', ''),
        'page': entry.get('pages', ''),
        'title': entry.get('title', ''),
        'type': entry.get('ENTRYTYPE', ''),
        'url': entry.get('url', ''),
        'volume': entry.get('volume', ''),
        'journaltitle': f"{entry.get('journal', entry.get('booktitle', ''))}",
        'date': entry.get('year', ''),
        'path': entry.get('pdf', ''),
        'code': entry.get('comment', '')

    }

    return yaml_entry


def write_yaml_file(entries, output_file):
    yaml_entries = [transform_to_yaml(entry) for entry in entries]

    with open(output_file, 'w', encoding='utf-8') as file:
        yaml.dump(yaml_entries, file, default_flow_style=False, sort_keys=False, allow_unicode=True)



# Example usage
entries = [PUBLICATION_LIST]
for entry in entries:
    write_yaml_file(entry, 'publications/publications.yml')
# %%
