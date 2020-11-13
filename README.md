#  :bookmark: mc-versions

[![action][action]][action-url]
[![license][license]][license-url]

Provides Minecraft version data in JSON format, updated daily from [Minecraft Wiki](https://minecraft.gamepedia.com/Minecraft_Wiki).

## Usage

The main and only endpoint is https://raw.githubusercontent.com/hugmanrique/mc-versions/master/versions.json.
It contains version data for the Java, Bedrock and Education editions of the game. The file follows this format:

```js
{
  "editions": {
    "java": {
      "name": "Java Edition",
      "versions": [
        {
          "name": "1.16.4",
          "protocolNumber": 754,
          "dataNumber": 2584
        },
        // ...
      ]
    },
    // ...
  }
}
```

Unknown/non-existent protocol/data numbers are indicated with `null`.

<table>
<thead>
  <tr>
    <th>Edition</th>
    <th>Version schema</th>
    <th>Comments</th>
  </tr>
</thead>
<tbody>
  <tr>
    <td><code>java</code></td>
<td>

```ts
{
  name: string;
  protocolNumber: number | null;
  dataNumber: number | null;
}
```

</td>
    <td>
      <ul>
        <li>Versions previous to 15w32a don't have a data number.</li>
        <li>Protocol numbers were reset on version 13w41a.</li>
      </ul>
    </td>
  </tr>
  <tr>
    <td><code>bedrock</code></td>
<td>

```ts
{
  name: string;
  protocolNumber: number | null;
}
```

</td><td></td>
  </tr>
  <tr>
    <td><code>education</code></td>
<td>

```ts
{
  name: string;
  protocolNumber: number | null;
}
```

</td><td></td>
  </tr>
</tbody>
</table>

The file is updated daily at 4:25 AM UTC, although this may change in the future.
No guarantees are made about the accuracy of the reported data.

## How it works

[Minecraft Wiki](https://minecraft.gamepedia.com/Minecraft_Wiki) generates the version data from a [Scribunto module](https://minecraft.gamepedia.com/Module:Protocol_version/Versions), generously maintained by its editors.
Unfortunately, the [MediaWiki API](https://www.mediawiki.org/wiki/API:Main_page) doesn't provide a way to fetch this data in a computer-friendly format.

For this reason, we scrap the [Template:Protocol version/Table](https://minecraft.gamepedia.com/Template:Protocol_version/Table) page, which contains the data produced by the module in HTML format.

We use the [node-html-parser](https://github.com/taoqf/node-html-parser) library to query the DOM tree.
The parser is fully extensible to future Minecraft editions and supports version name normalization.

## License

[MIT](LICENSE) &copy; [Hugo Manrique](https://hugmanrique.me)

The version data is provided by [Minecraft Wiki](https://minecraft.gamepedia.com/) and is available under [CC BY-NC-SA 3.0](https://creativecommons.org/licenses/by-nc-sa/3.0/).

[action]: https://github.com/hugmanrique/mc-versions/workflows/Update%20data/badge.svg
[action-url]: https://github.com/hugmanrique/mc-versions/actions
[license]: https://img.shields.io/github/license/hugmanrique/mc-versions.svg
[license-url]: LICENSE