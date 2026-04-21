# NVA application for XP

[NVA](https://nva.sikt.no) (Nasjonalt vitenarkiv / National Research Archive) is a service for registering and sharing Norwegian research publications.

This application integrates with the [NVA API](https://api.nva.unit.no), to import and cache publication data locally in XP, making it easy to create a relation between NVA data and content in your XP application.

This is the successor to [xp-cristin](https://github.com/ItemConsulting/xp-cristin), as NVA replaces the Cristin APIs.

<img src="src/main/resources/application.svg" width="150">

## Configuring your organization

This application imports data for **one organization**, specified in *no.item.xp.nva.cfg*.

> **Warning** You need a config file **XP_HOME/config/no.item.xp.nva.cfg** with this configuration:
> ```ini
> institution=<my-institution-number>
> ```

## Using local copies of the NVA data

We want to display data from NVA on our XP site, and to make it quick, searchable and robust, copies of data from the
API are stored in a local [repo (Elastic Search Database)](https://developer.enonic.com/docs/xp/stable/api/lib-repo) in XP.

Upon installation of this application – and then on a nightly schedule (03:00) – publication data from NVA is imported into the local repository:

- `"no.item.nva.results"`

Each node has the type `no.item.nva:result` and stores the full NVA API response in `data.raw`, along with flattened fields like `title` and `category` for efficient querying.

## Creating a relation between NVA data and XP Content

### NVA Result (Custom Selector)

Use the `no.item.xp.nva:nva-result` CustomSelector-service to select a publication from NVA and store its ID on your Content.

```xml
<input name="nvaResultId" type="CustomSelector">
  <label>Publications from NVA</label>
  <occurrences minimum="0" maximum="0"/>
  <config>
    <service>no.item.xp.nva:nva-result</service>
  </config>
</input>
```

The selector searches the local cache first, falling back to the NVA API. You can search by title, author name, or Cristin ID.

## Admin Widget

The app includes an admin widget that provides a link to trigger a manual import of all NVA data for your configured institution.

## Development

### Building

To build the project run the following code

```bash
enonic project build
```

### Deploy locally

Deploy locally for testing purposes:

```bash
enonic project deploy
```

### Running tests

```bash
npm test
```
